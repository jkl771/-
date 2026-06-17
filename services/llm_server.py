"""
本地 LLM 服务 - Qwen2.5-1.8B-Instruct (优化版)
"""
import sys, os, json, time

os.environ["PYTHONIOENCODING"] = "utf-8"

_real_stdout = sys.__stdout__
_real_stderr = sys.__stderr__
sys.stdout = open(os.devnull, 'w')
sys.stderr = open(os.devnull, 'w')

os.environ["MODELSCOPE_CACHE"] = os.path.join(os.path.expanduser("~"), ".cache", "modelscope")

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

MODEL_PATH = r"C:\Users\HYH\.cache\modelscope\models\Qwen\Qwen2___5-1___5B-Instruct"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_PATH,
    torch_dtype=torch.float16,
    device_map="cpu",
    trust_remote_code=True,
    low_cpu_mem_usage=True
)

import io
sys.stdout = io.TextIOWrapper(_real_stdout.buffer, encoding='utf-8', line_buffering=True)
sys.stderr = io.TextIOWrapper(_real_stderr.buffer, encoding='utf-8', line_buffering=True)

print(json.dumps({"status": "ready", "model": "Qwen2.5-1.8B-Instruct"}), flush=True)

def generate(system_prompt, user_prompt, max_tokens=500, temperature=0.7):
    """生成文本（优化版）"""
    messages = [
        {"role": "system", "content": str(system_prompt)},
        {"role": "user", "content": str(user_prompt)}
    ]
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(str(text), return_tensors="pt")
    
    t0 = time.time()
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            temperature=temperature,
            do_sample=True,
            top_p=0.9,
            top_k=50,
            repetition_penalty=1.1,
        )
    elapsed = time.time() - t0
    
    response = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
    return response.strip(), elapsed

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    
    try:
        req = json.loads(line)
        action = req.get("action", "generate")
        t0 = time.time()
        
        if action == "generate":
            result, gen_time = generate(
                req.get("system", "你是专业文案助手。直接返回结果，不要解释。"),
                req.get("prompt", ""),
                req.get("max_tokens", 500),
                req.get("temperature", 0.7)
            )
            elapsed = round(time.time() - t0, 2)
            print(json.dumps({
                "success": True,
                "data": {"text": result, "gen_time": round(gen_time, 2)},
                "elapsed": elapsed
            }, ensure_ascii=False), flush=True)
        
        elif action == "ping":
            print(json.dumps({"success": True, "data": {"status": "ok"}}, ensure_ascii=False), flush=True)
        
        else:
            print(json.dumps({"success": False, "error": f"Unknown action: {action}"}, ensure_ascii=False), flush=True)
    
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}, ensure_ascii=False), flush=True)
