from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import io
import os
from datetime import datetime
from typing import Dict, List, Any
import tempfile

class ReportGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.reports_dir = "reports"
        
        # Criar diretório de relatórios se não existir
        os.makedirs(self.reports_dir, exist_ok=True)
        
        # Estilos customizados
        self._create_custom_styles()
    
    def _create_custom_styles(self):
        """
        Cria estilos personalizados para o relatório
        """
        # Estilo para título principal
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=20,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#2E86AB')
        )
        
        # Estilo para subtítulos
        self.subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceBefore=20,
            spaceAfter=10,
            textColor=colors.HexColor('#A23B72')
        )
        
        # Estilo para texto normal
        self.normal_style = ParagraphStyle(
            'CustomNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=12
        )
    
    def create_exam_report(self, answer_key: Dict, students_results: List[Dict], analysis: Dict) -> str:
        """
        Cria relatório completo de análise de provas
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"relatorio_provas_{timestamp}.pdf"
        filepath = os.path.join(self.reports_dir, filename)
        
        # Criar documento
        doc = SimpleDocTemplate(filepath, pagesize=A4)
        story = []
        
        # Título
        title = Paragraph("RELATÓRIO DE CORREÇÃO DE PROVAS", self.title_style)
        story.append(title)
        
        # Informações gerais
        date_str = datetime.now().strftime("%d de %B de %Y")
        info_text = f"<b>Data da Análise:</b> {date_str}<br/>"
        info_text += f"<b>Total de Alunos:</b> {len(students_results)}<br/>"
        info_text += f"<b>Total de Questões:</b> {len(answer_key) if answer_key else 'N/A'}<br/>"
        info_text += f"<b>Sistema:</b> CorrigeAI - Análise Inteligente"
        
        info_para = Paragraph(info_text, self.normal_style)
        story.append(info_para)
        story.append(Spacer(1, 20))
        
        # Gabarito
        if answer_key:
            story.append(Paragraph("GABARITO OFICIAL", self.subtitle_style))
            gabarito_data = [["Questão", "Resposta"]]
            for q_num in sorted(answer_key.keys()):
                gabarito_data.append([str(q_num), answer_key[q_num]])
            
            gabarito_table = Table(gabarito_data, colWidths=[1*inch, 1*inch])
            gabarito_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E86AB')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(gabarito_table)
            story.append(Spacer(1, 20))
        
        # Desempenho dos alunos
        if students_results:
            story.append(Paragraph("DESEMPENHO INDIVIDUAL", self.subtitle_style))
            
            # Calcular estatísticas
            performance_data = self._calculate_performance_stats(students_results, answer_key)
            
            # Tabela de desempenho
            perf_table_data = [["Posição", "Nome", "Acertos", "Erros", "% Acertos"]]
            
            for i, student in enumerate(performance_data['ranking']):
                pos = f"{i+1}º"
                name = student['name'][:25] + "..." if len(student['name']) > 25 else student['name']
                acertos = student['correct_answers']
                erros = student['wrong_answers']
                percent = f"{student['percentage']:.1f}%"
                
                perf_table_data.append([pos, name, str(acertos), str(erros), percent])
            
            perf_table = Table(perf_table_data, colWidths=[0.8*inch, 2.5*inch, 0.8*inch, 0.8*inch, 1*inch])
            perf_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#A23B72')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(perf_table)
            story.append(Spacer(1, 20))
            
            # Questões mais erradas
            if performance_data['difficult_questions']:
                story.append(Paragraph("QUESTÕES MAIS DIFÍCEIS", self.subtitle_style))
                
                diff_table_data = [["Questão", "Nº Erros", "% Erros", "Gabarito"]]
                
                for q_data in performance_data['difficult_questions'][:10]:  # Top 10
                    question = str(q_data['question'])
                    errors = str(q_data['error_count'])
                    percent = f"{q_data['error_percentage']:.1f}%"
                    correct = answer_key.get(q_data['question'], 'N/A') if answer_key else 'N/A'
                    
                    diff_table_data.append([question, errors, percent, correct])
                
                diff_table = Table(diff_table_data, colWidths=[1*inch, 1*inch, 1*inch, 1*inch])
                diff_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F18F01')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.lightyellow),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                story.append(diff_table)
                story.append(Spacer(1, 20))
        
        # Análise da IA
        if analysis and 'summary' in analysis:
            story.append(Paragraph("ANÁLISE INTELIGENTE", self.subtitle_style))
            analysis_text = analysis['summary']
            analysis_para = Paragraph(analysis_text, self.normal_style)
            story.append(analysis_para)
            story.append(Spacer(1, 20))
        
        # Recomendações
        if analysis and 'recommendations' in analysis:
            story.append(Paragraph("RECOMENDAÇÕES PEDAGÓGICAS", self.subtitle_style))
            for i, rec in enumerate(analysis['recommendations'], 1):
                rec_text = f"<b>{i}.</b> {rec}"
                rec_para = Paragraph(rec_text, self.normal_style)
                story.append(rec_para)
                story.append(Spacer(1, 8))
        
        # Rodapé
        footer_text = f"<i>Relatório gerado pelo CorrigeAI em {date_str}</i>"
        footer_para = Paragraph(footer_text, self.normal_style)
        story.append(Spacer(1, 30))
        story.append(footer_para)
        
        # Construir PDF
        doc.build(story)
        
        return filepath
    
    def create_custom_report(self, title: str, content: str, report_type: str = "general") -> str:
        """
        Cria relatório personalizado
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"relatorio_{report_type}_{timestamp}.pdf"
        filepath = os.path.join(self.reports_dir, filename)
        
        doc = SimpleDocTemplate(filepath, pagesize=A4)
        story = []
        
        # Título
        title_para = Paragraph(title.upper(), self.title_style)
        story.append(title_para)
        story.append(Spacer(1, 20))
        
        # Data
        date_str = datetime.now().strftime("%d de %B de %Y às %H:%M")
        date_text = f"<b>Gerado em:</b> {date_str}"
        date_para = Paragraph(date_text, self.normal_style)
        story.append(date_para)
        story.append(Spacer(1, 20))
        
        # Conteúdo
        # Processar markdown básico
        content_processed = self._process_markdown(content)
        
        for section in content_processed:
            if section['type'] == 'heading':
                heading_para = Paragraph(section['text'], self.subtitle_style)
                story.append(heading_para)
            elif section['type'] == 'paragraph':
                para = Paragraph(section['text'], self.normal_style)
                story.append(para)
                story.append(Spacer(1, 10))
            elif section['type'] == 'list':
                for item in section['items']:
                    list_para = Paragraph(f"• {item}", self.normal_style)
                    story.append(list_para)
                story.append(Spacer(1, 10))
        
        # Rodapé
        footer_text = f"<i>Documento gerado pelo CorrigeAI</i>"
        footer_para = Paragraph(footer_text, self.normal_style)
        story.append(Spacer(1, 30))
        story.append(footer_para)
        
        doc.build(story)
        return filepath
    
    def _calculate_performance_stats(self, students_results: List[Dict], answer_key: Dict) -> Dict:
        """
        Calcula estatísticas de desempenho
        """
        if not answer_key:
            return {'ranking': [], 'difficult_questions': []}
        
        student_stats = []
        question_errors = {}
        
        # Processar cada aluno
        for student in students_results:
            if 'answers' not in student:
                continue
                
            correct = 0
            wrong = 0
            student_answers = student['answers']
            
            # Contar acertos e erros
            for q_num, correct_answer in answer_key.items():
                if q_num in student_answers:
                    if student_answers[q_num] == correct_answer:
                        correct += 1
                    else:
                        wrong += 1
                        # Registrar erro na questão
                        if q_num not in question_errors:
                            question_errors[q_num] = 0
                        question_errors[q_num] += 1
                else:
                    wrong += 1  # Questão não respondida conta como erro
                    if q_num not in question_errors:
                        question_errors[q_num] = 0
                    question_errors[q_num] += 1
            
            total_questions = len(answer_key)
            percentage = (correct / total_questions * 100) if total_questions > 0 else 0
            
            student_stats.append({
                'name': student['name'],
                'correct_answers': correct,
                'wrong_answers': wrong,
                'percentage': percentage,
                'total_questions': total_questions
            })
        
        # Ordenar por desempenho
        student_stats.sort(key=lambda x: x['percentage'], reverse=True)
        
        # Calcular questões mais difíceis
        total_students = len(students_results)
        difficult_questions = []
        
        for q_num, error_count in question_errors.items():
            error_percentage = (error_count / total_students * 100) if total_students > 0 else 0
            difficult_questions.append({
                'question': q_num,
                'error_count': error_count,
                'error_percentage': error_percentage
            })
        
        # Ordenar por dificuldade
        difficult_questions.sort(key=lambda x: x['error_percentage'], reverse=True)
        
        return {
            'ranking': student_stats,
            'difficult_questions': difficult_questions,
            'total_students': total_students,
            'average_score': sum(s['percentage'] for s in student_stats) / len(student_stats) if student_stats else 0
        }
    
    def _process_markdown(self, content: str) -> List[Dict]:
        """
        Processa markdown básico para estruturar o conteúdo
        """
        lines = content.split('\n')
        sections = []
        current_list = []
        
        for line in lines:
            line = line.strip()
            if not line:
                if current_list:
                    sections.append({'type': 'list', 'items': current_list})
                    current_list = []
                continue
            
            if line.startswith('##'):
                if current_list:
                    sections.append({'type': 'list', 'items': current_list})
                    current_list = []
                sections.append({'type': 'heading', 'text': line.replace('##', '').strip()})
            elif line.startswith('#'):
                if current_list:
                    sections.append({'type': 'list', 'items': current_list})
                    current_list = []
                sections.append({'type': 'heading', 'text': line.replace('#', '').strip()})
            elif line.startswith('•') or line.startswith('-') or line.startswith('*'):
                current_list.append(line[1:].strip())
            else:
                if current_list:
                    sections.append({'type': 'list', 'items': current_list})
                    current_list = []
                sections.append({'type': 'paragraph', 'text': line})
        
        if current_list:
            sections.append({'type': 'list', 'items': current_list})
        
        return sections
    
    def create_performance_chart(self, students_data: List[Dict]) -> str:
        """
        Cria gráfico de desempenho dos alunos
        """
        if not students_data:
            return ""
        
        # Preparar dados
        names = [s['name'][:15] + "..." if len(s['name']) > 15 else s['name'] for s in students_data]
        scores = [s['percentage'] for s in students_data]
        
        # Criar gráfico
        fig, ax = plt.subplots(figsize=(12, 8))
        bars = ax.bar(range(len(names)), scores, color=['#2E86AB', '#A23B72', '#F18F01'] * len(names))
        
        # Customizar
        ax.set_xlabel('Alunos')
        ax.set_ylabel('Pontuação (%)')
        ax.set_title('Desempenho dos Alunos')
        ax.set_xticks(range(len(names)))
        ax.set_xticklabels(names, rotation=45, ha='right')
        ax.set_ylim(0, 100)
        
        # Adicionar valores nas barras
        for bar, score in zip(bars, scores):
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height + 1,
                   f'{score:.1f}%', ha='center', va='bottom')
        
        # Salvar
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        chart_path = os.path.join(self.reports_dir, f"grafico_desempenho_{timestamp}.png")
        plt.tight_layout()
        plt.savefig(chart_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        return chart_path
