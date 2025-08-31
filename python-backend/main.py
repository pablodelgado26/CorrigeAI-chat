from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
import io
import base64
from typing import List, Optional
import tempfile
import json
from datetime import datetime
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

# Importar módulos customizados
from modules.pdf_processor import PDFProcessor
from modules.image_processor import ImageProcessor
from modules.ocr_processor import OCRProcessor
from modules.report_generator import ReportGenerator
from modules.azure_openai_client import AzureOpenAIClient

app = FastAPI(title="CorrigeAI Backend", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-vercel-domain.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar processadores
pdf_processor = PDFProcessor()
image_processor = ImageProcessor()
ocr_processor = OCRProcessor()
report_generator = ReportGenerator()
ai_client = AzureOpenAIClient()

@app.get("/")
async def root():
    return {"message": "CorrigeAI Backend API está funcionando!"}

@app.post("/analyze-exams")
async def analyze_exams(
    files: List[UploadFile] = File(...),
    instructions: str = Form(...)
):
    """
    Analisa provas enviadas e gera relatório completo
    """
    try:
        print(f"Recebidos {len(files)} arquivos para análise")
        results = []
        answer_key = None
        students_results = []
        
        # Processar cada arquivo
        for file in files:
            print(f"Processando arquivo: {file.filename}")
            file_content = await file.read()
            
            # Detectar tipo de arquivo
            if file.content_type.startswith('image/'):
                print(f"Processando como imagem: {file.content_type}")
                # Processar imagem
                image_data = image_processor.process_image(file_content)
                text_content = ocr_processor.extract_text_from_image(file_content)
                
                # Verificar se é gabarito
                if 'GABARITO' in text_content.upper():
                    print("Detectado GABARITO na imagem")
                    answer_key = ocr_processor.extract_answer_key(text_content)
                    print(f"Gabarito extraído: {answer_key}")
                else:
                    # É prova de aluno
                    print("Detectada prova de aluno na imagem")
                    student_data = ocr_processor.extract_student_answers(text_content)
                    students_results.append(student_data)
                    
            elif file.content_type == 'application/pdf':
                print(f"Processando como PDF: {file.content_type}")
                # Processar PDF
                text_content = pdf_processor.extract_text(file_content)
                print(f"Texto extraído do PDF (primeiros 500 chars): {text_content[:500]}")
                
                if 'GABARITO' in text_content.upper():
                    print("Detectado GABARITO no PDF")
                    answer_key = pdf_processor.extract_answer_key(text_content)
                    print(f"Gabarito extraído: {answer_key}")
                else:
                    print("Detectada prova de aluno no PDF")
                    student_data = pdf_processor.extract_student_answers(text_content)
                    students_results.append(student_data)
                    print(f"Dados do aluno: {student_data}")
        
        print(f"Processamento concluído. Gabarito: {answer_key}, Alunos: {len(students_results)}")
        
        # Gerar análise com IA
        print("Iniciando análise com IA...")
        analysis = await ai_client.analyze_exam_results(
            answer_key=answer_key,
            students_results=students_results,
            instructions=instructions
        )
        print(f"Análise IA concluída: {analysis}")
        
        # Gerar relatório PDF
        print("Gerando relatório PDF...")
        report_path = report_generator.create_exam_report(
            answer_key=answer_key,
            students_results=students_results,
            analysis=analysis
        )
        print(f"Relatório gerado em: {report_path}")
        
        return {
            "success": True,
            "answer_key": answer_key,
            "students_count": len(students_results),
            "analysis": analysis,
            "report_url": f"/download-report/{os.path.basename(report_path)}"
        }
        
    except Exception as e:
        print(f"Erro durante análise: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-text-from-image")
async def extract_text_from_image(file: UploadFile = File(...)):
    """
    Extrai texto de uma imagem usando OCR
    """
    try:
        file_content = await file.read()
        text = ocr_processor.extract_text_from_image(file_content)
        
        return {
            "success": True,
            "text": text,
            "confidence": ocr_processor.get_confidence_score(file_content)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create-pdf-report")
async def create_pdf_report(
    title: str = Form(...),
    content: str = Form(...),
    report_type: str = Form("general")
):
    """
    Cria um relatório PDF personalizado
    """
    try:
        report_path = report_generator.create_custom_report(
            title=title,
            content=content,
            report_type=report_type
        )
        
        return {
            "success": True,
            "report_url": f"/download-report/{os.path.basename(report_path)}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download-report/{filename}")
async def download_report(filename: str):
    """
    Download de relatório gerado
    """
    report_path = os.path.join("reports", filename)
    
    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Relatório não encontrado")
    
    return FileResponse(
        path=report_path,
        filename=filename,
        media_type='application/pdf'
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
