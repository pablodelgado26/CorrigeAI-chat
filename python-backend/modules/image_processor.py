import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import io
from typing import Tuple, Dict, Any

class ImageProcessor:
    def __init__(self):
        self.supported_formats = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']
    
    def process_image(self, image_content: bytes) -> Dict[str, Any]:
        """
        Processa imagem para melhorar qualidade do OCR
        """
        try:
            # Converter bytes para PIL Image
            image = Image.open(io.BytesIO(image_content))
            
            # Converter para RGB se necessário
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Obter informações básicas
            info = {
                'original_size': image.size,
                'mode': image.mode,
                'format': image.format
            }
            
            # Preprocessar para OCR
            processed_image = self._preprocess_for_ocr(image)
            
            # Converter de volta para bytes
            output_buffer = io.BytesIO()
            processed_image.save(output_buffer, format='PNG')
            processed_bytes = output_buffer.getvalue()
            
            info['processed_image'] = processed_bytes
            info['processed_size'] = processed_image.size
            
            return info
            
        except Exception as e:
            raise Exception(f"Erro ao processar imagem: {str(e)}")
    
    def _preprocess_for_ocr(self, image: Image.Image) -> Image.Image:
        """
        Preprocessa imagem para melhorar OCR
        """
        # 1. Redimensionar se muito pequena
        width, height = image.size
        if width < 1000 or height < 1000:
            scale_factor = max(1000/width, 1000/height)
            new_size = (int(width * scale_factor), int(height * scale_factor))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # 2. Aumentar contraste
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.2)
        
        # 3. Aumentar nitidez
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.1)
        
        # 4. Converter para escala de cinza para melhor OCR
        image = image.convert('L')
        
        # 5. Aplicar filtro para reduzir ruído
        image = image.filter(ImageFilter.MedianFilter(size=3))
        
        return image
    
    def detect_text_regions(self, image_content: bytes) -> list:
        """
        Detecta regiões com texto usando OpenCV
        """
        try:
            # Converter bytes para numpy array
            nparr = np.frombuffer(image_content, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Converter para escala de cinza
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Aplicar filtro gaussiano
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Detectar bordas
            edged = cv2.Canny(blurred, 30, 150)
            
            # Encontrar contornos
            contours, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Filtrar contornos que podem ser texto
            text_regions = []
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                
                # Filtrar por tamanho (assumir que texto tem certas proporções)
                if w > 20 and h > 10 and w < image.shape[1] * 0.8:
                    text_regions.append({
                        'x': x, 'y': y, 'width': w, 'height': h,
                        'area': w * h
                    })
            
            # Ordenar por posição (top-down, left-right)
            text_regions.sort(key=lambda r: (r['y'], r['x']))
            
            return text_regions
            
        except Exception as e:
            print(f"Erro ao detectar regiões de texto: {e}")
            return []
    
    def enhance_image_quality(self, image_content: bytes) -> bytes:
        """
        Melhora qualidade geral da imagem
        """
        try:
            image = Image.open(io.BytesIO(image_content))
            
            # Melhorar brilho e contraste
            enhancer = ImageEnhance.Brightness(image)
            image = enhancer.enhance(1.1)
            
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.2)
            
            # Reduzir ruído
            image = image.filter(ImageFilter.MedianFilter(size=3))
            
            # Salvar resultado
            output_buffer = io.BytesIO()
            image.save(output_buffer, format='PNG', quality=95)
            
            return output_buffer.getvalue()
            
        except Exception as e:
            raise Exception(f"Erro ao melhorar qualidade: {str(e)}")
    
    def extract_image_metadata(self, image_content: bytes) -> Dict:
        """
        Extrai metadados da imagem
        """
        try:
            image = Image.open(io.BytesIO(image_content))
            
            metadata = {
                'size': image.size,
                'mode': image.mode,
                'format': image.format,
                'has_exif': hasattr(image, '_getexif') and image._getexif() is not None
            }
            
            # Tentar extrair EXIF se disponível
            if metadata['has_exif']:
                try:
                    exif = image._getexif()
                    if exif:
                        metadata['exif'] = {k: v for k, v in exif.items() if isinstance(v, (str, int, float))}
                except:
                    pass
            
            return metadata
            
        except Exception as e:
            return {'error': str(e)}
    
    def crop_to_content(self, image_content: bytes) -> bytes:
        """
        Corta a imagem para focar no conteúdo principal
        """
        try:
            # Usar OpenCV para detectar conteúdo
            nparr = np.frombuffer(image_content, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Threshold para encontrar conteúdo
            _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
            
            # Encontrar contornos
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Encontrar bounding box de todo o conteúdo
                x_min, y_min = image.shape[1], image.shape[0]
                x_max, y_max = 0, 0
                
                for contour in contours:
                    x, y, w, h = cv2.boundingRect(contour)
                    x_min = min(x_min, x)
                    y_min = min(y_min, y)
                    x_max = max(x_max, x + w)
                    y_max = max(y_max, y + h)
                
                # Adicionar margem
                margin = 20
                x_min = max(0, x_min - margin)
                y_min = max(0, y_min - margin)
                x_max = min(image.shape[1], x_max + margin)
                y_max = min(image.shape[0], y_max + margin)
                
                # Cortar imagem
                cropped = image[y_min:y_max, x_min:x_max]
                
                # Converter de volta para bytes
                _, buffer = cv2.imencode('.png', cropped)
                return buffer.tobytes()
            
            return image_content
            
        except Exception as e:
            print(f"Erro ao cortar imagem: {e}")
            return image_content
