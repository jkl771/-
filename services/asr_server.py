"""
视频智能体 - 常驻 ASR 服务
启动后模型只加载一次，后续请求直接复用
监听 stdin JSON 请求，输出 JSON 结果
"""
import sys, os, json, time

# 抑制启动时的所有输出
_real_stdout = sys.__stdout__
sys.stdout = open(os.devnull, 'w')
sys.stderr = open(os.devnull, 'w')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ["MODELSCOPE_CACHE"] = os.path.join(os.path.expanduser("~"), ".cache", "modelscope")

from extract_audio import (
    extract_full_pipeline, check_duplicate, check_duplicate_url,
    list_materials, get_material, delete_material, _get_model
)

# 预加载模型
_get_model()

# 恢复 stdout 用于通信
sys.stdout = _real_stdout

# 发送就绪信号
print(json.dumps({"status": "ready"}), flush=True)

# 主循环：从 stdin 读取请求，处理后输出结果
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    
    try:
        req = json.loads(line)
        action = req.get("action", "extract")
        t0 = time.time()
        
        if action == "extract":
            result = extract_full_pipeline(
                share_text=req.get("share_text"),
                url=req.get("url")
            )
        elif action == "check_duplicate":
            result = check_duplicate(
                share_text=req.get("share_text"),
                url=req.get("url")
            )
        elif action == "list_materials":
            result = list_materials()
        elif action == "get_material":
            result = get_material(req.get("id", ""))
        elif action == "delete_material":
            result = delete_material(req.get("id", ""))
        elif action == "ping":
            result = {"status": "ok"}
        else:
            result = {"error": f"Unknown action: {action}"}
        
        elapsed = round(time.time() - t0, 2)
        print(json.dumps({"success": True, "data": result, "elapsed": elapsed}), flush=True)
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), flush=True)
