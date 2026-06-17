"""模型预加载 - dev server 启动时调用"""
import sys, os
sys.stdout = open(os.devnull, 'w')
sys.stderr = open(os.devnull, 'w')
os.environ["MODELSCOPE_CACHE"] = os.path.join(os.path.expanduser("~"), ".cache", "modelscope")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extract_audio import _get_model
model = _get_model()
# 写一个标记文件表示模型已加载
with open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "output", ".model_ready"), "w") as f:
    f.write("ready")
