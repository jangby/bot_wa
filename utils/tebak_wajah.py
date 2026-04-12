import sys
import json
import os

# Mematikan peringatan log TensorFlow agar tidak mengotori output teks (sangat penting untuk Node.js)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import logging
logging.getLogger('tensorflow').setLevel(logging.FATAL)

# Mengarahkan output standar sementara agar library DeepFace tidak mencetak pesan aneh-aneh
import io
old_stdout = sys.stdout
sys.stdout = io.StringIO()

try:
    from deepface import DeepFace
    
    # Argumen 1 adalah lokasi gambar yang dikirim oleh Node.js
    img_path = sys.argv[1] 
    
    # enforce_detection=False agar AI mencoba menebak meski wajah agak terpotong/buram
    hasil = DeepFace.analyze(img_path=img_path, actions=['age', 'gender', 'race', 'emotion'], enforce_detection=False)
    data = hasil[0]

    output = {
        "status": "success",
        "umur": data['age'],
        "gender": data['dominant_gender'],
        "ras": data['dominant_race'],
        "emosi": data['dominant_emotion']
    }
except Exception as e:
    output = {
        "status": "error",
        "message": str(e)
    }

# Kembalikan output standar dan cetak hasil JSON murni untuk ditangkap oleh Node.js
sys.stdout = old_stdout
print(json.dumps(output))