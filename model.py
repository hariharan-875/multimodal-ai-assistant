import os
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types


# ============================================================
# LOAD ENVIRONMENT
# ============================================================

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY is not configured")


# ============================================================
# GEMINI CLIENT
# ============================================================

client = genai.Client(
    api_key=api_key
)


# ============================================================
# HELPER FUNCTION
# ============================================================

def generate_with_retry(contents):
    """
    Send request to Gemini with automatic retry
    for temporary 503 overload errors.
    """

    for attempt in range(3):

        try:

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents
            )

            return response.text

        except Exception as e:

            error_message = str(e)

            if "503" in error_message or "UNAVAILABLE" in error_message:

                if attempt < 2:

                    time.sleep(2)

                    continue

                return (
                    "Gemini is temporarily experiencing high demand. "
                    "Please try again in a few seconds."
                )

            raise e


# ============================================================
# TEXT GENERATION
# ============================================================

def generate_response(prompt):

    return generate_with_retry(
        prompt
    )


# ============================================================
# IMAGE ANALYSIS
# ============================================================

def analyze_image(
    prompt,
    image_bytes,
    mime_type
):

    contents = [
        types.Part.from_bytes(
            data=image_bytes,
            mime_type=mime_type
        ),
        prompt
    ]

    return generate_with_retry(
        contents
    )


# ============================================================
# PDF ANALYSIS
# ============================================================

def analyze_pdf(
    prompt,
    pdf_bytes
):

    contents = [
        types.Part.from_bytes(
            data=pdf_bytes,
            mime_type="application/pdf"
        ),
        prompt
    ]

    return generate_with_retry(
        contents
    )


# ============================================================
# AUDIO ANALYSIS
# ============================================================

def analyze_audio(
    prompt,
    audio_bytes,
    mime_type
):

    contents = [
        types.Part.from_bytes(
            data=audio_bytes,
            mime_type=mime_type
        ),
        prompt
    ]

    return generate_with_retry(
        contents
    )