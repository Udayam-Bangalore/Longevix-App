import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_PATH = "./llama_3_2_1b_instruct"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_PATH, dtype=torch.float32, device_map="cpu"
)
model.to(torch.device("cpu"))


def generate_text(prompt: str, max_tokens: int = 150):
    inputs = tokenizer(prompt, return_tensors="pt").to(torch.device("cpu"))

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            temperature=0.5,
            top_p=0.9,
            do_sample=False,
            num_beams=1,
            early_stopping=True
        )

    full_output = tokenizer.decode(output[0], skip_special_tokens=True)
    generated_text = full_output[len(prompt) :].strip()
    return generated_text
