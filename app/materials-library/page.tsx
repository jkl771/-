'use client';
import { useState, useEffect } from 'react';
export default function MaterialsLibraryPage() {
  const [tab, setTab] = useState<'add' | 'candidates' | 'approved' | 'crawler'>('add');
  const [addText, setAddText] = useState('');
  const [batchText, setBatchText] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [approved, setApproved] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [crawler, setCrawler] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const loadAll = async () => {
    try {
      const [c, a, s, cr] = await Promise.all([
        fetch('/api/materials-library?action=candidates').then(r => r.json()),
        fetch('/api/materials-library?action=approved').then(r => r.json()),
        fetch('/api/materials-library?action=stats').then(r => r.json()),
        fetch('/api/materials-library?action=crawler').then(r => r.json()),
      ]);
      if (c.success) setCandidates(c.data);
      if (a.success) setApproved(a.data);
      if (s.success) setStats(s.data);
      if (cr.success) setCrawler(cr.data);
    } catch (e: any) { setError(e?.message || '操作失败'); }
  };
  useEffect(() => { loadAll(); }, []);
  const handleAdd = async () => {
    if (!addText.trim()) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/materials-library', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', texts: [addText] }),
      });
      const d = await res.json();
      if (d.success) { setMsg('✅ 已加入候选区'); setAddText(''); loadAll(); }
      else setMsg('❌ ' + (d.error || '失败'));
    } catch (e: any) { setMsg('❌ ' + e.message); }
    finally { setLoading(false); }
  };
  const handleBatchImport = async () => {
    if (!batchText.trim()) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/materials-library', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', text: batchText }),
      });
      const d = await res.json();
      if (d.success) { setMsg('✅ 导入 ' + d.imported + ' 条到候选区'); setBatchText(''); loadAll(); }
      else setMsg('❌ ' + (d.error || '失败'));
    } catch (e: any) { setMsg('❌ ' + e.message); }
    finally { setLoading(false); }
  };
  const handleApprove = async (text: string) => {
    await fetch('/api/materials-library', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', text }),
    });
    loadAll();
  };
  const handleApproveAll = async () => {
    await fetch('/api/materials-library', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve_all' }),
    });
    setMsg('✅ 全部批准入库');
    loadAll();
  };
  const handleRemove = async (text: string) => {
    await fetch('/api/materials-library', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', text }),
    });
    loadAll();
  };
  const handleCrawlerToggle = async () => {
    if (!crawler?.enabled) {
      if (!confirm('⚠️ 爬虫有风险，请避免多次使用。确认开启？')) return;
    }
    await fetch('/api/materials-library', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'crawler_toggle', enabled: !crawler?.enabled }),
    });
    loadAll();
  };
  const handleCrawlerTest = async (sourceId: string) => {
    setMsg('测试中...');
    const res = await fetch('/api/materials-library', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'crawler_test', sourceId }),
    });
    const d = await res.json();
    setMsg(d.data?.message || '测试完成');
    loadAll();
  };
  const handleCrawlerFetch = async (sourceId: string) => {
    setMsg('抓取中...');
    const res = await fetch('/api/materials-library', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'crawler_fetch', sourceId }),
    });
    const d = await res.json();
    setMsg('抓取 ' + (d.data?.success || 0) + ' 条');
    loadAll();
  };
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📚 素材库管理</h1>
      {msg && <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-800 text-sm">{msg}</div>}
      {/* 统计概览 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card text-center"><div className="text-2xl font-bold">{stats.candidates}</div><div className="text-sm text-gray-500">候选素材</div></div>
          <div className="card text-center"><div className="text-2xl font-bold">{stats.approved}</div><div className="text-sm text-gray-500">已入库</div></div>
          <div className="card text-center"><div className="text-2xl font-bold">{Object.keys(stats.byStyle || {}).length}</div><div className="text-sm text-gray-500">风格分类</div></div>
          <div className="card text-center"><div className="text-2xl font-bold">{crawler?.sources?.length || 0}</div><div className="text-sm text-gray-500">爬虫源</div></div>
        </div>
      )}
      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6">
        {([['add', '➕ 添加素材'], ['candidates', '📋 候选区'], ['approved', '✅ 已入库'], ['crawler', '🕷️ 爬虫管理']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 rounded-lg text-sm ${tab === key ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>
      {/* 添加素材 */}
      {tab === 'add' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">单条添加</h2>
            <textarea className="input-field h-24 mb-3" placeholder="输入一条话术素材..." value={addText} onChange={e => setAddText(e.target.value)} />
            <button onClick={handleAdd} disabled={loading || !addText.trim()} className="btn-primary">
              {loading ? '添加中...' : '➕ 加入候选区'}
            </button>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">批量导入（每行一条）</h2>
            <textarea className="input-field h-48 mb-3" placeholder={"粘贴多条话术，每行一条：\n说真的，这个太好用了\n你知道吗？原来如此\n赶紧下单，错过就没了"} value={batchText} onChange={e => setBatchText(e.target.value)} />
            <button onClick={handleBatchImport} disabled={loading || !batchText.trim()} className="btn-primary">
              {loading ? '导入中...' : '📥 批量导入候选区'}
            </button>
          </div>
        </div>
      )}
      {/* 候选区 */}
      {tab === 'candidates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">候选素材 ({candidates.length})</h2>
            {candidates.length > 0 && (
              <button onClick={handleApproveAll} className="btn-primary text-sm">✅ 全部批准入库</button>
            )}
          </div>
          {candidates.length === 0 ? (
            <div className="card text-gray-500 text-center py-8">暂无候选素材，请先添加</div>
          ) : (
            candidates.map((c, i) => (
              <div key={i} className="card">
                <div className="text-sm mb-2">{c.text}</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {c.tags?.style?.map((s: string) => <span key={s} className="badge-info text-xs">{s}</span>)}
                  {c.tags?.emotion?.map((e: string) => <span key={e} className="badge-warning text-xs">{e}</span>)}
                  {c.tags?.scene?.map((s: string) => <span key={s} className="badge-success text-xs">{s}</span>)}
                  <span className="text-xs text-gray-400">质量:{c.tags?.quality}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(c.text)} className="btn-primary text-xs">✅ 批准入库</button>
                  <button onClick={() => handleRemove(c.text)} className="btn-secondary text-xs">🗑️ 删除</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {/* ??????????? */}
      {tab === 'approved' && (() => {
        const sg: Record<string, {l:string;i:string;c:string;b:string}> = {
          casual:{l:'口语化',i:'🗣️',c:'text-blue-700',b:'bg-blue-50 border-blue-200'},
          storytelling:{l:'故事化',i:'📖',c:'text-purple-700',b:'bg-purple-50 border-purple-200'},
          sales:{l:'带货',i:'🛒',c:'text-orange-700',b:'bg-orange-50 border-orange-200'},
          educational:{l:'知识讲解',i:'🎓',c:'text-green-700',b:'bg-green-50 border-green-200'},
        };
        const gr: Record<string, any[]> = {casual:[],storytelling:[],sales:[],educational:[]};
        for(const m of approved){const k=m.tags?.style?.[0]||'casual';if(gr[k])gr[k].push(m);else gr.casual.push(m);}
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">已入库素材 ({approved.length})</h2>
              <div className="flex gap-2 text-xs">
                {Object.entries(gr).map(([k,a])=>a.length>0&&<span key={k} className={`px-2 py-0.5 rounded-full ${sg[k]?.b} ${sg[k]?.c}`}>{sg[k]?.i} {a.length}</span>)}
              </div>
            </div>
            {approved.length===0?<div className="card text-gray-500 text-center py-8">暂无入库素材</div>:
              Object.entries(gr).filter(([,a])=>a.length>0).map(([sk,a])=>{
                const mt=sg[sk]||sg.casual;
                return (
                  <details key={sk} open={sk==='casual'} className={`rounded-xl border ${mt.b}`}>
                    <summary className={`px-4 py-3 cursor-pointer font-medium text-sm flex items-center gap-2 ${mt.c}`}>
                      <span>{mt.i} {mt.l}</span>
                      <span className="ml-auto text-xs font-normal text-gray-500">{a.length} 条</span>
                      <span className="text-xs text-gray-400">▼</span>
                    </summary>
                    <div className="px-3 pb-3 space-y-2">
                      {a.map((m:any,i:number)=>(
                        <div key={i} className="bg-white rounded-lg p-3 text-sm leading-relaxed border border-gray-100 shadow-sm">
                          <div className="text-gray-800">{m.text}</div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {m.tags?.emotion?.map((e:string)=><span key={e} className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">{e}</span>)}
                            {m.tags?.hookType?.map((h:string)=><span key={h} className="text-xs px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-600">{h}</span>)}
                            {m.tags?.scene?.map((s:string)=><span key={s} className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">{s}</span>)}
                            <span className="text-xs text-gray-400 ml-auto">质量:{m.tags?.quality}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })
            }
          </div>
        );
      })()}
      {/* 爬虫管理 */}
      {tab === 'crawler' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">🕷️ 爬虫功能</h2>
                <p className="text-sm text-gray-500">默认关闭，开启后可从网站抓取话术素材</p>
              </div>
              <button onClick={handleCrawlerToggle} className={`px-4 py-2 rounded-lg text-sm font-medium ${crawler?.enabled ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                {crawler?.enabled ? '🔴 关闭爬虫' : '🟢 开启爬虫'}
              </button>
            </div>
            {crawler?.enabled && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                ⚠️ 爬虫有风险，请避免频繁使用。每个源需测试 2 次通过后才可抓取。
              </div>
            )}
          </div>
          <h3 className="font-semibold">内置源 ({crawler?.sources?.length || 0})</h3>
          {crawler?.sources?.map((s: any) => (
            <div key={s.id} className="card">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-sm">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.url}</div>
                  <div className="text-xs mt-1">
                    状态：<span className={s.status === 'passed' ? 'text-green-600' : s.status === 'failed' ? 'text-red-600' : 'text-gray-500'}>
                      {s.status === 'passed' ? '✅ 已通过' : s.status === 'failed' ? '❌ 失败' : s.status === 'testing' ? '⏳ 测试中' : '⬜ 未测试'}
                    </span>
                    <span className="ml-2">测试次数: {s.testCount}/2</span>
                    {s.fetchCount > 0 && <span className="ml-2">已抓取: {s.fetchCount}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {crawler?.enabled && s.status !== 'passed' && (
                    <button onClick={() => handleCrawlerTest(s.id)} className="btn-secondary text-xs">🔍 测试</button>
                  )}
                  {crawler?.enabled && s.status === 'passed' && (
                    <button onClick={() => handleCrawlerFetch(s.id)} className="btn-primary text-xs">📥 抓取</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}