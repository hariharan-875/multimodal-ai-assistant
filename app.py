from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from model import (
    generate_response,
    analyze_image,
    analyze_pdf,
    analyze_audio
)


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="Multimodal AI Assistant",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ============================================================
# API ROUTES
# ============================================================

@app.get("/health")
async def health():

    return {
        "status": "success",
        "message": "Multimodal AI Backend is running"
    }


@app.post("/generate")
async def generate(
    prompt: str = Form(...),
    input_type: str = Form("text"),
    file: UploadFile | None = File(None)
):

    try:

        # ---------------- TEXT ----------------

        if input_type == "text":

            response = generate_response(prompt)


        # ---------------- IMAGE ----------------

        elif input_type == "image":

            if file is None:

                return {
                    "success": False,
                    "response": "Please upload an image."
                }

            file_data = await file.read()

            response = analyze_image(
                prompt,
                file_data,
                file.content_type
            )


        # ---------------- PDF ----------------

        elif input_type == "pdf":

            if file is None:

                return {
                    "success": False,
                    "response": "Please upload a PDF."
                }

            file_data = await file.read()

            response = analyze_pdf(
                prompt,
                file_data
            )


        # ---------------- AUDIO ----------------

        elif input_type == "audio":

            if file is None:

                return {
                    "success": False,
                    "response": "Please upload an audio file."
                }

            file_data = await file.read()

            response = analyze_audio(
                prompt,
                file_data,
                file.content_type
            )


        else:

            return {
                "success": False,
                "response": "Invalid input type."
            }


        return {
            "success": True,
            "response": response
        }


    except Exception as e:

        return {
            "success": False,
            "response": f"Something went wrong: {str(e)}"
        }


# ============================================================
# STATIC FRONTEND
# ============================================================

app.mount(
    "/",
    StaticFiles(
        directory=".",
        html=True
    ),
    name="frontend"
)


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.environ.get("PORT", 8000))

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port
    )