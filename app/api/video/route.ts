import { NextRequest, NextResponse } from 'next/server';
import { createProject, addTrack, setSubtitles, autoGenerateSubtitles, calibrateSubtitles, setAudioMix, exportSrt, renderVideo } from '@/services/video';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const project = await createProject(body.name);
        return NextResponse.json({ success: true, data: project });
      }

      case 'add_track': {
        const project = addTrack(body.projectId, body.track);
        if (!project) return NextResponse.json({ error: '工程不存在' }, { status: 404 });
        return NextResponse.json({ success: true, data: project });
      }

      case 'set_subtitles': {
        const project = setSubtitles(body.projectId, body.subtitles);
        if (!project) return NextResponse.json({ error: '工程不存在' }, { status: 404 });
        return NextResponse.json({ success: true, data: project });
      }

      case 'auto_subtitles': {
        const project = autoGenerateSubtitles(
          body.projectId,
          body.text,
          body.totalDuration,
          body.style
        );
        if (!project) return NextResponse.json({ error: '工程不存在' }, { status: 404 });
        return NextResponse.json({ success: true, data: project });
      }

      case 'calibrate': {
        const project = calibrateSubtitles(body.projectId, body.offset);
        if (!project) return NextResponse.json({ error: '工程不存在' }, { status: 404 });
        return NextResponse.json({ success: true, data: project });
      }

      case 'audio_mix': {
        const project = setAudioMix(body.projectId, body.mix);
        if (!project) return NextResponse.json({ error: '工程不存在' }, { status: 404 });
        return NextResponse.json({ success: true, data: project });
      }

      case 'export_srt': {
        const path = await exportSrt(body.projectId);
        return NextResponse.json({ success: true, data: { path } });
      }

      case 'render': {
        const project = await renderVideo(body.projectId);
        return NextResponse.json({ success: true, data: project });
      }

      default:
        return NextResponse.json({ error: `未知 action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '视频处理失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
