import fitz  # PyMuPDF
import pdfplumber
import io
import re
from typing import Dict, List, Optional

class PDFProcessor:
    def __init__(self):
        self.supported_formats = ['.pdf']
    
    def extract_text(self, pdf_content: bytes) -> str:
        """
        Extrai texto de um PDF usando PyMuPDF
        """
        try:
            # Usar PyMuPDF para extração rápida
            doc = fitz.open(stream=pdf_content, filetype="pdf")
            text = ""
            
            for page_num in range(doc.page_count):
                page = doc.load_page(page_num)
                text += page.get_text()
            
            doc.close()
            return text
            
        except Exception as e:
            print(f"Erro ao extrair texto com PyMuPDF: {e}")
            # Fallback para pdfplumber
            return self._extract_with_pdfplumber(pdf_content)
    
    def _extract_with_pdfplumber(self, pdf_content: bytes) -> str:
        """
        Extrai texto usando pdfplumber (melhor para tabelas)
        """
        try:
            with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
                text = ""
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                return text
        except Exception as e:
            print(f"Erro ao extrair texto com pdfplumber: {e}")
            return ""
    
    def extract_tables(self, pdf_content: bytes) -> List[List[List[str]]]:
        """
        Extrai tabelas do PDF
        """
        try:
            with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
                all_tables = []
                for page in pdf.pages:
                    tables = page.extract_tables()
                    if tables:
                        all_tables.extend(tables)
                return all_tables
        except Exception as e:
            print(f"Erro ao extrair tabelas: {e}")
            return []
    
    def extract_answer_key(self, text: str) -> Dict[int, str]:
        """
        Extrai gabarito do texto
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
                question_num = int(match[0])
                answer = match[1].upper()
                if 1 <= question_num <= 100:  # Validar número da questão
                    answer_key[question_num] = answer
        
        # Se não encontrou padrões estruturados, tentar extrair sequências
        if not answer_key:
            # Procurar sequências como "1A 2B 3C 4D 5E"
            sequence_pattern = r'(\d+)([A-E])'
            sequences = re.findall(sequence_pattern, text_clean, re.IGNORECASE)
            for seq in sequences:
                question_num = int(seq[0])
                answer = seq[1].upper()
                if 1 <= question_num <= 100:
                    answer_key[question_num] = answer
        
        print(f"Gabarito extraído: {answer_key}")
        return answer_key
    
    def extract_student_answers(self, text: str) -> Dict:
        """
        Extrai respostas de um aluno
        """
        student_data = {
            'name': self._extract_student_name(text),
            'answers': {},
            'raw_text': text
        }
        
        # Limpar e normalizar texto
        text_clean = ' '.join(text.split('\n')).replace('\n', ' ')
        
        # Padrões para respostas de alunos (similares ao gabarito)
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
                question_num = int(match[0])
                answer = match[1].upper()
                if 1 <= question_num <= 100:  # Validar número da questão
                    student_data['answers'][question_num] = answer
        
        # Se não encontrou padrões estruturados, tentar extrair sequências
        if not student_data['answers']:
            # Procurar sequências como "1A 2B 3C 4D 5E"
            sequence_pattern = r'(\d+)([A-E])'
            sequences = re.findall(sequence_pattern, text_clean, re.IGNORECASE)
            for seq in sequences:
                question_num = int(seq[0])
                answer = seq[1].upper()
                if 1 <= question_num <= 100:
                    student_data['answers'][question_num] = answer
        
        print(f"Respostas do aluno {student_data['name']}: {student_data['answers']}")
        return student_data
    
    def _extract_student_name(self, text: str) -> str:
        """
        Tenta extrair o nome do aluno do texto
        """
        lines = text.split('\n')[:10]  # Procurar nas primeiras linhas
        
        name_patterns = [
            r'Nome:\s*(.+)',
            r'Aluno:\s*(.+)',
            r'Estudante:\s*(.+)',
            r'NOME:\s*(.+)'
        ]
        
        for line in lines:
            for pattern in name_patterns:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    return match.group(1).strip()
        
        return "Aluno não identificado"
    
    def get_pdf_info(self, pdf_content: bytes) -> Dict:
        """
        Obtém informações sobre o PDF
        """
        try:
            doc = fitz.open(stream=pdf_content, filetype="pdf")
            info = {
                'page_count': doc.page_count,
                'metadata': doc.metadata,
                'is_encrypted': doc.is_encrypted,
                'has_images': False
            }
            
            # Verificar se há imagens
            for page_num in range(min(3, doc.page_count)):  # Verificar primeiras 3 páginas
                page = doc.load_page(page_num)
                if page.get_images():
                    info['has_images'] = True
                    break
            
            doc.close()
            return info
            
        except Exception as e:
            return {'error': str(e)}
