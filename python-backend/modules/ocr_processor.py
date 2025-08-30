import pytesseract
from PIL import Image
import io
import re
from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np

class OCRProcessor:
    def __init__(self):
        # Configurações do Tesseract
        self.tesseract_config = '--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz().,:-'
        
        # Configuração específica para português
        self.tesseract_config_pt = '--oem 3 --psm 6 -l por'
    
    def extract_text_from_image(self, image_content: bytes, language: str = 'por') -> str:
        """
        Extrai texto de imagem usando OCR
        """
        try:
            # Preprocessar imagem
            processed_image = self._preprocess_image(image_content)
            
            # Configurar Tesseract
            config = self.tesseract_config_pt if language == 'por' else self.tesseract_config
            
            # Extrair texto
            text = pytesseract.image_to_string(processed_image, config=config)
            
            # Limpar texto
            cleaned_text = self._clean_extracted_text(text)
            
            return cleaned_text
            
        except Exception as e:
            raise Exception(f"Erro no OCR: {str(e)}")
    
    def extract_text_with_confidence(self, image_content: bytes) -> Dict:
        """
        Extrai texto com informações de confiança
        """
        try:
            processed_image = self._preprocess_image(image_content)
            
            # Extrair texto com dados detalhados
            data = pytesseract.image_to_data(processed_image, output_type=pytesseract.Output.DICT)
            
            # Processar resultados
            text_blocks = []
            confidences = []
            
            for i in range(len(data['text'])):
                if int(data['conf'][i]) > 30:  # Filtrar baixa confiança
                    word = data['text'][i].strip()
                    if word:
                        text_blocks.append({
                            'text': word,
                            'confidence': int(data['conf'][i]),
                            'bbox': {
                                'x': data['left'][i],
                                'y': data['top'][i],
                                'width': data['width'][i],
                                'height': data['height'][i]
                            }
                        })
                        confidences.append(int(data['conf'][i]))
            
            # Calcular confiança média
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            # Reconstruir texto
            full_text = ' '.join([block['text'] for block in text_blocks])
            
            return {
                'text': full_text,
                'confidence': avg_confidence,
                'blocks': text_blocks,
                'word_count': len(text_blocks)
            }
            
        except Exception as e:
            raise Exception(f"Erro no OCR detalhado: {str(e)}")
    
    def extract_answer_key(self, text: str) -> Dict[int, str]:
        """
        Extrai gabarito do texto reconhecido
        """
        answer_key = {}
        lines = text.split('\n')
        
        # Limpar e normalizar texto
        text_clean = ' '.join(lines).replace('\n', ' ')
        
        # Padrões mais abrangentes para gabarito
        patterns = [
            r'(\d+)[\.\)\-\s:]+([A-E])',  # 1. A, 2) B, 3 - C, 4: D
            r'(\d+)\s*[:-]\s*([A-E])',    # 1: A, 2 : B
            r'(\d+)\s+([A-E])',           # 1 A, 2 B
            r'Q\s*(\d+)\s*[:-]\s*([A-E])', # Q1: A, Q2 : B
            r'(\d+)º?\s*[:-]\s*([A-E])',  # 1º: A, 2º - B
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text_clean, re.IGNORECASE)
            for match in matches:
                try:
                    question_num = int(match[0])
                    answer = match[1].upper()
                    if 1 <= question_num <= 100 and answer in ['A', 'B', 'C', 'D', 'E']:
                        answer_key[question_num] = answer
                except ValueError:
                    continue
        
        # Se não encontrou padrões estruturados, tentar extrair sequências
        if not answer_key:
            # Procurar sequências como "1A 2B 3C 4D 5E"
            sequence_pattern = r'(\d+)([A-E])'
            sequences = re.findall(sequence_pattern, text_clean, re.IGNORECASE)
            for seq in sequences:
                try:
                    question_num = int(seq[0])
                    answer = seq[1].upper()
                    if 1 <= question_num <= 100:
                        answer_key[question_num] = answer
                except ValueError:
                    continue
        
        print(f"Gabarito OCR extraído: {answer_key}")
        return answer_key
    
    def extract_student_answers(self, text: str) -> Dict:
        """
        Extrai respostas de aluno do texto
        """
        student_data = {
            'name': self._extract_student_name(text),
            'id': self._extract_student_id(text),
            'answers': {},
            'raw_text': text,
            'confidence': self._estimate_text_quality(text)
        }
        
        # Extrair respostas usando múltiplos padrões
        answers = self._extract_answers_multiple_patterns(text)
        student_data['answers'] = answers
        
        return student_data
    
    def _preprocess_image(self, image_content: bytes) -> Image.Image:
        """
        Preprocessa imagem para melhorar OCR
        """
        # Abrir imagem
        image = Image.open(io.BytesIO(image_content))
        
        # Converter para RGB se necessário
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Converter para OpenCV
        opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Converter para escala de cinza
        gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
        
        # Aplicar desfoque gaussiano para reduzir ruído
        blurred = cv2.GaussianBlur(gray, (1, 1), 0)
        
        # Aplicar threshold adaptivo
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        
        # Aplicar operações morfológicas para limpar
        kernel = np.ones((1, 1), np.uint8)
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        # Converter de volta para PIL
        result_image = Image.fromarray(cleaned)
        
        return result_image
    
    def _clean_extracted_text(self, text: str) -> str:
        """
        Limpa texto extraído pelo OCR
        """
        # Remover caracteres estranhos comuns do OCR
        text = re.sub(r'[^\w\s\.\,\:\;\(\)\-\+\=]', '', text)
        
        # Corrigir espaçamentos múltiplos
        text = re.sub(r'\s+', ' ', text)
        
        # Remover linhas muito curtas ou suspeitas
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if len(line) > 2:  # Manter apenas linhas com mais de 2 caracteres
                cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    def _extract_student_name(self, text: str) -> str:
        """
        Extrai nome do aluno do texto
        """
        lines = text.split('\n')[:15]  # Procurar nas primeiras linhas
        
        name_patterns = [
            r'Nome[\:\s]+(.+)',
            r'Aluno[\:\s]+(.+)',
            r'Estudante[\:\s]+(.+)',
            r'NOME[\:\s]+(.+)',
            r'Nome\s*(.+)',
            r'([A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+)',  # Padrão nome sobrenome
        ]
        
        for line in lines:
            for pattern in name_patterns:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    name = match.group(1).strip()
                    # Validar se parece um nome real
                    if len(name) > 3 and not re.match(r'^\d+$', name):
                        return name
        
        return "Aluno não identificado"
    
    def _extract_student_id(self, text: str) -> str:
        """
        Extrai ID/matrícula do aluno
        """
        lines = text.split('\n')[:10]
        
        id_patterns = [
            r'Matrícula[\:\s]+(\d+)',
            r'ID[\:\s]+(\d+)',
            r'Número[\:\s]+(\d+)',
            r'RA[\:\s]+(\d+)',
        ]
        
        for line in lines:
            for pattern in id_patterns:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    return match.group(1)
        
        return ""
    
    def _extract_answers_multiple_patterns(self, text: str) -> Dict[int, str]:
        """
        Extrai respostas usando múltiplos padrões
        """
        answers = {}
        
        # Limpar e normalizar texto
        text_clean = ' '.join(text.split('\n')).replace('\n', ' ')
        
        # Padrões para diferentes formatos de resposta (similares ao gabarito)
        patterns = [
            r'(\d+)[\.\)\-\s:]+([A-E])',     # 1. A, 2) B, 3 - C, 4: D
            r'(\d+)\s*[:-]\s*([A-E])',       # 1: A, 2 : B
            r'(\d+)\s+([A-E])',              # 1 A, 2 B
            r'Q\s*(\d+)\s*[:-]\s*([A-E])',   # Q1: A, Q2 : B
            r'(\d+)º?\s*[:-]\s*([A-E])',     # 1º: A, 2º - B
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text_clean, re.IGNORECASE)
            for match in matches:
                try:
                    question_num = int(match[0])
                    answer = match[1].upper()
                    
                    if answer in ['A', 'B', 'C', 'D', 'E'] and 1 <= question_num <= 100:
                        answers[question_num] = answer
                except (ValueError, IndexError):
                    continue
        
        # Se não encontrou padrões estruturados, tentar extrair sequências
        if not answers:
            # Procurar sequências como "1A 2B 3C 4D 5E"
            sequence_pattern = r'(\d+)([A-E])'
            sequences = re.findall(sequence_pattern, text_clean, re.IGNORECASE)
            for seq in sequences:
                try:
                    question_num = int(seq[0])
                    answer = seq[1].upper()
                    if 1 <= question_num <= 100:
                        answers[question_num] = answer
                except (ValueError, IndexError):
                    continue
        
        print(f"Respostas OCR extraídas: {answers}")
        return answers
    
    def _estimate_text_quality(self, text: str) -> float:
        """
        Estima a qualidade do texto extraído
        """
        if not text:
            return 0.0
        
        # Contar caracteres válidos vs inválidos
        total_chars = len(text)
        valid_chars = len(re.findall(r'[a-zA-Z0-9\s\.\,\:\;\(\)\-]', text))
        
        quality_score = valid_chars / total_chars if total_chars > 0 else 0
        
        # Penalizar se há muitos caracteres estranhos
        strange_chars = len(re.findall(r'[^\w\s\.\,\:\;\(\)\-]', text))
        if strange_chars > total_chars * 0.1:  # Mais de 10% caracteres estranhos
            quality_score *= 0.5
        
        return min(1.0, quality_score)
    
    def get_confidence_score(self, image_content: bytes) -> float:
        """
        Obtém score de confiança do OCR
        """
        try:
            processed_image = self._preprocess_image(image_content)
            
            # Extrair dados com confiança
            data = pytesseract.image_to_data(processed_image, output_type=pytesseract.Output.DICT)
            
            # Calcular confiança média dos blocos válidos
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            
            if confidences:
                return sum(confidences) / len(confidences) / 100.0  # Normalizar para 0-1
            else:
                return 0.0
                
        except Exception as e:
            print(f"Erro ao calcular confiança: {e}")
            return 0.0
