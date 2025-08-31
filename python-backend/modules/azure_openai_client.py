import os
from typing import Dict, List, Optional
import json
from openai import AzureOpenAI

class AzureOpenAIClient:
    def __init__(self):
        # Configurar cliente Azure OpenAI
        self.api_key = os.getenv('AZURE_OPENAI_API_KEY')
        self.endpoint = os.getenv('AZURE_OPENAI_ENDPOINT', 'https://openai-sesi.openai.azure.com')
        self.deployment_name = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'o4-mini')
        self.api_version = os.getenv('AZURE_OPENAI_API_VERSION', '2025-01-01-preview')
        
        if not self.api_key:
            raise ValueError("AZURE_OPENAI_API_KEY environment variable is required")
        
        # Configurar cliente usando nova sintaxe
        self.client = AzureOpenAI(
            api_key=self.api_key,
            azure_endpoint=self.endpoint,
            api_version=self.api_version,
        )
    
    async def analyze_exam_results(self, answer_key: Dict, students_results: List[Dict], instructions: str) -> Dict:
        """
        Analisa resultados de provas usando IA
        """
        try:
            # Preparar dados para análise
            analysis_data = {
                'answer_key': answer_key,
                'students_count': len(students_results),
                'students_results': students_results
            }
            
            # Calcular estatísticas básicas
            if answer_key and students_results:
                stats = self._calculate_basic_stats(answer_key, students_results)
                analysis_data.update(stats)
            
            # Prompt para análise
            prompt = self._create_analysis_prompt(analysis_data, instructions)
            
            # Fazer requisição
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um especialista em análise educacional. Analise os dados de provas e forneça insights pedagógicos valiosos."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_completion_tokens=2000
            )
            
            # Processar resposta
            analysis_text = response.choices[0].message.content
            
            # Extrair componentes da análise
            analysis_components = self._parse_analysis_response(analysis_text)
            
            return {
                'raw_response': analysis_text,
                'summary': analysis_components.get('summary', ''),
                'recommendations': analysis_components.get('recommendations', []),
                'insights': analysis_components.get('insights', []),
                'statistics': analysis_data
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'summary': 'Erro ao gerar análise com IA',
                'recommendations': ['Verifique a configuração da API'],
                'statistics': analysis_data if 'analysis_data' in locals() else {}
            }
    
    async def enhance_ocr_text(self, extracted_text: str, context: str = "exam") -> str:
        """
        Melhora texto extraído por OCR usando IA
        """
        try:
            prompt = f"""
            O texto abaixo foi extraído por OCR de uma {context}. Corrija erros de reconhecimento,
            mantenha a estrutura original e melhore a legibilidade:
            
            {extracted_text}
            
            Retorne apenas o texto corrigido, mantendo numeração e formatação.
            """
            
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é especialista em correção de texto extraído por OCR."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_completion_tokens=1500
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"Erro ao melhorar OCR: {e}")
            return extracted_text
    
    async def analyze_single_image(self, image_base64: str, context: str) -> Dict:
        """
        Analisa uma única imagem com contexto específico
        """
        try:
            prompt = f"""
            Analise esta imagem no contexto de: {context}
            
            Se for uma prova ou gabarito:
            1. Identifique se é gabarito ou prova de aluno
            2. Extraia o nome do aluno (se aplicável)
            3. Liste todas as respostas marcadas
            4. Avalie a qualidade da imagem para OCR
            
            Retorne um JSON estruturado com os dados encontrados.
            """
            
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é especialista em análise de documentos educacionais."
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_completion_tokens=1000
            )
            
            analysis_text = response.choices[0].message.content
            
            # Tentar parsear JSON
            try:
                return json.loads(analysis_text)
            except:
                return {'raw_analysis': analysis_text}
                
        except Exception as e:
            return {'error': str(e)}
    
    def _calculate_basic_stats(self, answer_key: Dict, students_results: List[Dict]) -> Dict:
        """
        Calcula estatísticas básicas dos resultados
        """
        if not answer_key or not students_results:
            return {}
        
        total_questions = len(answer_key)
        student_scores = []
        question_errors = {}
        
        # Inicializar contadores de erro por questão
        for q_num in answer_key.keys():
            question_errors[q_num] = 0
        
        # Processar cada aluno
        for student in students_results:
            if 'answers' not in student:
                continue
                
            correct_count = 0
            student_answers = student['answers']
            
            for q_num, correct_answer in answer_key.items():
                if q_num in student_answers:
                    if student_answers[q_num] == correct_answer:
                        correct_count += 1
                    else:
                        question_errors[q_num] += 1
                else:
                    question_errors[q_num] += 1  # Não respondida = erro
            
            score_percentage = (correct_count / total_questions) * 100
            student_scores.append(score_percentage)
        
        # Calcular estatísticas
        if student_scores:
            avg_score = sum(student_scores) / len(student_scores)
            max_score = max(student_scores)
            min_score = min(student_scores)
        else:
            avg_score = max_score = min_score = 0
        
        # Questões mais difíceis
        difficult_questions = sorted(
            question_errors.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:5]
        
        return {
            'average_score': avg_score,
            'max_score': max_score,
            'min_score': min_score,
            'total_questions': total_questions,
            'student_scores': student_scores,
            'difficult_questions': difficult_questions
        }
    
    def _create_analysis_prompt(self, data: Dict, instructions: str) -> str:
        """
        Cria prompt para análise da IA
        """
        prompt = f"""
        Analise os seguintes dados de correção de provas:

        INSTRUÇÕES ESPECÍFICAS: {instructions}

        DADOS:
        - Total de alunos: {data.get('students_count', 0)}
        - Total de questões: {data.get('total_questions', 0)}
        - Média da turma: {data.get('average_score', 0):.1f}%
        - Maior nota: {data.get('max_score', 0):.1f}%
        - Menor nota: {data.get('min_score', 0):.1f}%

        QUESTÕES MAIS DIFÍCEIS:
        """
        
        if 'difficult_questions' in data:
            for q_num, error_count in data['difficult_questions']:
                error_rate = (error_count / data['students_count']) * 100 if data['students_count'] > 0 else 0
                prompt += f"- Questão {q_num}: {error_count} erros ({error_rate:.1f}%)\n"
        
        prompt += """
        
        Por favor, forneça:
        
        ## RESUMO EXECUTIVO
        [Análise geral do desempenho da turma]
        
        ## PONTOS DE ATENÇÃO
        [Questões ou áreas que precisam de reforço]
        
        ## RECOMENDAÇÕES PEDAGÓGICAS
        1. [Primeira recomendação]
        2. [Segunda recomendação]
        3. [Terceira recomendação]
        
        ## INSIGHTS ESPECÍFICOS
        [Observações detalhadas sobre padrões identificados]
        """
        
        return prompt
    
    def _parse_analysis_response(self, response_text: str) -> Dict:
        """
        Extrai componentes específicos da resposta da IA
        """
        components = {
            'summary': '',
            'recommendations': [],
            'insights': []
        }
        
        lines = response_text.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            
            if '## RESUMO EXECUTIVO' in line.upper():
                current_section = 'summary'
                continue
            elif '## RECOMENDAÇÕES' in line.upper():
                current_section = 'recommendations'
                continue
            elif '## INSIGHTS' in line.upper():
                current_section = 'insights'
                continue
            elif line.startswith('##'):
                current_section = None
                continue
            
            if current_section == 'summary' and line:
                components['summary'] += line + ' '
            elif current_section == 'recommendations' and line:
                if line.startswith(('1.', '2.', '3.', '4.', '5.', '-', '•')):
                    # Remover numeração/marcadores
                    clean_rec = line.lstrip('12345.-• ')
                    if clean_rec:
                        components['recommendations'].append(clean_rec)
            elif current_section == 'insights' and line:
                components['insights'].append(line)
        
        # Limpar summary
        components['summary'] = components['summary'].strip()
        
        return components
