import { NextRequest, NextResponse } from 'next/server';
import { createPublishTask, executePublish, listPublishTasks, retryPublish } from '@/services/publish';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const task = await createPublishTask(body);
        return NextResponse.json({ success: true, data: task });
      }

      case 'execute': {
        const task = await executePublish(body.taskId);
        return NextResponse.json({ success: true, data: task });
      }

      case 'list': {
        const tasks = listPublishTasks();
        return NextResponse.json({ success: true, data: tasks });
      }

      case 'retry': {
        const task = await retryPublish(body.taskId, body.platform);
        return NextResponse.json({ success: true, data: task });
      }

      default:
        return NextResponse.json({ error: `未知 action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '发布处理失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
