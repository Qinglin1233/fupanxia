
const D = window.FUPAN_DATA;
const $ = s => document.querySelector(s);
const view = $("#view");
const pageTitle = $("#pageTitle");
const pageEyebrow = $("#pageEyebrow");
const toastEl = $("#toast");

const STORE_KEY = "fupanxia_state_v1";
const defaultState = {
  records: [],
  reviewTasks: [],
  practiceAttempts: [],
  teacherReviews: [],
  customQuestions: [],
  settings: { studentName:"体验学生", aiMode:"local", aiProvider:"DeepSeek", apiKey:"" },
  draft: null,
  role: "student"
};

let state = loadState();
let currentRoute = "home";

function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? {...defaultState, ...JSON.parse(raw)} : structuredClone(defaultState);
  }catch(e){ return structuredClone(defaultState); }
}
function saveState(){
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  $("#storageState").textContent = "● 已保存到当前浏览器";
}
function toast(msg){
  toastEl.textContent = msg; toastEl.classList.add("show");
  setTimeout(()=>toastEl.classList.remove("show"),1800);
}
function fmt(ts){ return new Date(ts).toLocaleString("zh-CN",{hour12:false}); }
function dateOnly(ts){ return new Date(ts).toLocaleDateString("zh-CN"); }
function uid(prefix="id"){ return prefix+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,7); }
function courseName(id){ return D.courses.find(c=>c.id===id)?.name || id; }
function esc(s=""){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }

const navItems = [
  ["home","🏠","学习首页"],["start","🧭","开始复盘"],["archive","🗂️","复盘档案"],["practice","📝","专项练习"],
  ["today","📅","今日复习"],["report","📊","学习报告"],["teacher","👩‍🏫","教师工作台"],["resources","📚","课程资料与题库"],["settings","⚙️","设置与帮助"]
];
function renderNav(){
  $("#mainNav").innerHTML = navItems.map(([id,ico,label])=>`<button data-route="${id}" class="${currentRoute===id?"active":""}">${ico} ${label}</button>`).join("");
}
document.addEventListener("click",e=>{
  const r=e.target.closest("[data-route]"); if(r){ navigate(r.dataset.route); }
  const a=e.target.closest("[data-action]"); if(a){ handleAction(a.dataset.action,a); }
});
$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");

function navigate(route){
  currentRoute=route; renderNav(); $("#sidebar").classList.remove("open");
  const map={
    home:["学习中心","学习首页"],start:["复盘流程","开始复盘"],archive:["学习档案","我的错题与复盘档案"],
    practice:["巩固训练","专项练习"],today:["复习管理","今日复习"],report:["学习分析","学习报告"],
    teacher:["教师角色演示","教师工作台"],resources:["课程资源","课程资料与题库"],settings:["系统设置","设置与帮助"]
  };
  pageEyebrow.textContent=map[route][0]; pageTitle.textContent=map[route][1];
  ({home:renderHome,start:renderStart,archive:renderArchive,practice:renderPractice,today:renderToday,report:renderReport,teacher:renderTeacher,resources:renderResources,settings:renderSettings}[route]||renderHome)();
}
function calcStats(){
  const real=state.records.filter(r=>!r.isDemo);
  const all=state.records;
  const correct=state.practiceAttempts.filter(x=>x.scorable);
  const correctN=correct.filter(x=>x.correct).length;
  return {realCount:real.length, allCount:all.length, practice:state.practiceAttempts.length, due:state.reviewTasks.filter(t=>t.status==="待复习").length,
    accuracy:correct.length?Math.round(correctN/correct.length*100):null};
}
function renderHome(){
  const s=calcStats();
  view.innerHTML=`
  <div class="card hero">
    <div class="tag" style="background:rgba(255,255,255,.14);color:white">教学智能体应用创新设计大赛 · 演示版</div>
    <h2 style="font-size:34px;margin:12px 0 8px">把“做错”变成一次真正学会的机会</h2>
    <p>复盘侠不会急着给答案，而是先了解你的思路，再诊断、提示、验证，并把复盘记录保存下来。</p>
    <div class="hero-actions"><button class="btn accent" data-route="start">开始一次复盘</button><button class="btn secondary" data-action="start-demo">体验内置案例</button></div>
  </div>
  <div class="grid grid-4" style="margin-top:18px">
    <div class="card stat"><small>真实本地复盘</small><strong>${s.realCount}</strong><span class="small">不含演示数据</span></div>
    <div class="card stat"><small>练习完成数</small><strong>${s.practice}</strong><span class="small">按真实提交记录</span></div>
    <div class="card stat"><small>到期复习</small><strong>${s.due}</strong><span class="small">可调整日期</span></div>
    <div class="card stat"><small>有效正确率</small><strong>${s.accuracy===null?"—":s.accuracy+"%"}</strong><span class="small">仅统计可客观判定题目</span></div>
  </div>
  <div class="section-head" style="margin-top:26px"><div><h3>四类复盘入口</h3><p>选择与你当前问题最接近的方式。</p></div></div>
  <div class="grid grid-4">
    ${entryCard("📘","错题复盘","题目、原答案、原思路 → 错因诊断与迁移练习","wrong")}
    ${entryCard("💻","编程纠错","定位可疑代码，分级提示，保存修改版本","code")}
    ${entryCard("🧪","实训与项目","从证据、决策和下一步行动进行复盘","project")}
    ${entryCard("🧾","考试与阶段学习","分析失分知识点并生成短期复习计划","exam")}
  </div>
  <div class="grid grid-2" style="margin-top:22px">
    <div class="card"><div class="section-head"><div><h3>最近复盘</h3><p>刷新页面后仍可读取。</p></div><button class="ghost-btn" data-route="archive">查看全部</button></div>${recentRecords()}</div>
    <div class="card"><div class="section-head"><div><h3>待验证知识点</h3><p>来自真实复盘状态。</p></div></div>${pendingKps()}</div>
  </div>`;
}
function entryCard(icon,title,desc,type){
  return `<div class="card entry-card"><div class="icon">${icon}</div><h3>${title}</h3><p>${desc}</p><button class="btn secondary go" data-action="start-type" data-type="${type}">进入</button></div>`;
}
function recentRecords(){
  const rows=[...state.records].sort((a,b)=>b.createdAt-a.createdAt).slice(0,4);
  if(!rows.length) return `<div class="empty">还没有复盘记录。可以先体验一个演示案例。</div>`;
  return `<div class="list">${rows.map(r=>`<div class="list-item"><div><b>${esc(r.title||r.originalTask.slice(0,24))}</b> ${r.isDemo?'<span class="tag warn">演示数据</span>':''}<div class="meta">${courseName(r.course)} · ${r.masteryStatus} · ${fmt(r.createdAt)}</div></div><button class="ghost-btn" data-action="open-record" data-id="${r.id}">打开</button></div>`).join("")}</div>`;
}
function pendingKps(){
  const rows=state.records.filter(r=>["需要讲解","提示后完成","待再次验证"].includes(r.masteryStatus)).slice(-5).reverse();
  if(!rows.length) return `<div class="empty">暂无待验证知识点。</div>`;
  return `<div class="list">${rows.map(r=>`<div class="list-item"><div><b>${esc(r.knowledgePoint||"待确认知识点")}</b><div class="meta">${courseName(r.course)} · ${r.masteryStatus}</div></div><span class="tag ${r.masteryStatus==="待再次验证"?"warn":""}">${r.masteryStatus}</span></div>`).join("")}</div>`;
}

function renderStart(prefType){
  const type = prefType || state.draft?.type || "wrong";
  view.innerHTML=`
  <div class="card">
    <div class="stepper"><span class="step active">1 输入问题</span><span class="step">2 诊断追问</span><span class="step">3 分级提示</span><span class="step">4 重新作答</span><span class="step">5 迁移练习</span><span class="step">6 复盘卡</span></div>
    <div class="tabs">
      ${[["wrong","错题复盘"],["code","编程纠错"],["project","实训/项目"],["exam","考试/阶段"]].map(([v,l])=>`<button class="tab ${type===v?"active":""}" data-action="switch-type" data-type="${v}">${l}</button>`).join("")}
    </div>
    ${reviewForm(type)}
  </div>`;
}
function reviewForm(type){
  const common=`<div class="field"><label>课程</label><select id="course">${D.courses.map(c=>`<option value="${c.id}">${c.name}</option>`).join("")}</select></div>`;
  if(type==="wrong") return `<form id="reviewForm" class="form-grid">${common}
    <div class="field"><label>知识点（可选）</label><input id="kp" placeholder="例如：range边界"/></div>
    <div class="field full"><label>题目 *</label><textarea id="task" placeholder="请输入原题"></textarea></div>
    <div class="field full"><label>我的原答案 *</label><textarea id="answer" placeholder="请输入你当时的答案"></textarea></div>
    <div class="field full"><label>我当时是怎么想的</label><textarea id="thought" placeholder="尽量写出思考过程；未填写时，系统不会直接认定具体错因"></textarea></div>
    <div class="field full"><label>正确答案（可选）</label><textarea id="expected" placeholder="如有可填写"></textarea></div>
    <div class="field full"><button type="button" class="btn accent" data-action="submit-review" data-type="wrong">开始诊断</button></div></form>`;
  if(type==="code") return `<form id="reviewForm" class="form-grid">${common}
    <div class="field full"><div class="warning">当前纯前端版不执行用户代码，只做静态分析。不会显示“测试通过”。</div></div>
    <div class="field full"><label>任务要求 *</label><textarea id="task"></textarea></div>
    <div class="field full"><label>代码 *</label><textarea id="answer" class="code" style="min-height:180px"></textarea></div>
    <div class="field"><label>报错信息</label><textarea id="error"></textarea></div>
    <div class="field"><label>预期输出 / 实际输出</label><textarea id="expected"></textarea></div>
    <div class="field full"><label>你自己的判断</label><textarea id="thought"></textarea></div>
    <div class="field full"><button type="button" class="btn accent" data-action="submit-review" data-type="code">开始静态诊断</button></div></form>`;
  if(type==="project") return `<form id="reviewForm" class="form-grid">${common}
    <div class="field full"><label>实训/项目目标 *</label><textarea id="task"></textarea></div>
    <div class="field"><label>个人承担部分</label><textarea id="rolepart"></textarea></div>
    <div class="field"><label>最终结果</label><textarea id="expected"></textarea></div>
    <div class="field full"><label>完成过程 *</label><textarea id="answer"></textarea></div>
    <div class="field"><label>遇到的问题</label><textarea id="error"></textarea></div>
    <div class="field"><label>采取的解决方法</label><textarea id="thought"></textarea></div>
    <div class="field full"><button type="button" class="btn accent" data-action="submit-review" data-type="project">开始项目复盘</button></div></form>`;
  return `<form id="reviewForm" class="form-grid">${common}
    <div class="field full"><label>阶段/考试说明 *</label><textarea id="task" placeholder="例如：Python期中考试，共100分"></textarea></div>
    <div class="field"><label>得分</label><input id="score" type="number" min="0"/></div><div class="field"><label>满分</label><input id="fullscore" type="number" min="1"/></div>
    <div class="field full"><label>失分题目与知识点 *</label><textarea id="answer" placeholder="例：第3题 range边界，5/10；第6题 列表索引，0/10"></textarea></div>
    <div class="field full"><label>你认为的主要问题</label><textarea id="thought"></textarea></div>
    <div class="field full"><button type="button" class="btn accent" data-action="submit-review" data-type="exam">开始阶段复盘</button></div></form>`;
}

function localAnalyze(type, payload){
  const text=(payload.task+" "+payload.answer+" "+payload.thought).toLowerCase();
  let category="待确认",kp=payload.kp||"待确认知识点",issue="",question="",hint1="",hint2="",hint3="";
  if(type==="code"){
    if(/index|\[\s*\d+\s*\]|列表|越界/.test(text)){category="代码逻辑";kp=kp==="待确认知识点"?"列表索引":kp;issue="代码中可能存在索引边界问题，需要确认列表长度与访问位置。";question="请先确认：被访问序列的长度是多少？当前索引是否小于长度？";hint1="先检查索引与len(...)的关系。";hint2="Python正索引范围是0到len-1。";hint3="若要取最后一个元素，可考虑使用 -1。";}
    else if(/for|while|range|循环/.test(text)){category="代码逻辑";kp=kp==="待确认知识点"?"循环条件":kp;issue="循环边界或终止条件是优先检查位置。";question="你的循环从什么值开始，在什么条件下停止？最后一个期望值是否真的会被遍历？";hint1="先手工列出前3次循环变量。";hint2="注意range的stop不包含。";hint3="重新写出开始值、结束条件和每轮更新。";}
    else {category="待确认";issue="当前只能做静态分析，尚不足以确认唯一错误位置。";question="你认为最可能出错的是哪一行？为什么？";hint1="先缩小到最小可疑代码段。";hint2="逐行检查输入、变量更新、条件和返回值。";hint3="把预期值与每一步实际推导值逐项对照。";}
  } else if(type==="project"){
    category="推理步骤";kp="项目复盘与结果验证";issue="项目复盘应区分“做了什么”和“有什么证据证明结果有效”。";question="你目前有什么可核对的证据能证明目标已经完成？";hint1="先列出一个最关键的结果证据。";hint2="证据可以是测试结果、指标、截图、对比或可复现实验。";hint3="把“完成情况—证据—问题—下一步行动”分别写清楚。";
  } else if(type==="exam"){
    category="待确认";kp="阶段薄弱知识点";issue="需要从失分题目中区分知识问题、步骤问题与表达问题。";question="请从失分最多的一题开始：你当时是不知道知识点，还是知道但步骤/表达出了问题？";hint1="先按失分从高到低排序。";hint2="把每题归到知识、步骤或表达之一。";hint3="优先补失分高且可迁移到多题的知识点。";
  } else {
    if(/range|循环|for/.test(text)){category=payload.thought?"条件识别":"待确认";kp=kp==="待确认知识点"?"range边界":kp;issue="可能涉及循环边界或“结束值是否包含”的理解。";question="你认为 range(start, stop) 中的 stop 会被包含吗？";hint1="先想“左闭右开”。";hint2="stop本身不会进入序列。";hint3="如果想包含5，通常stop需要写6。";}
    else if(/and|or|where|sql/.test(text)){category=payload.thought?"条件识别":"待确认";kp=kp==="待确认知识点"?"WHERE逻辑条件":kp;issue="可能混淆了“同时满足”和“满足其一”的逻辑关系。";question="题目要求的是两个条件同时成立，还是满足任意一个即可？";hint1="把条件翻译成中文的“且/或”。";hint2="“且”通常对应AND，“或”对应OR。";hint3="重新写出只保留正确逻辑连接词的WHERE条件。";}
    else if(/训练集|测试集|验证集/.test(text)){category=payload.thought?"概念理解":"待确认";kp=kp==="待确认知识点"?"训练/验证/测试集":kp;issue="可能混淆了训练、调参与最终评估的数据职责。";question="如果要调超参数，你会优先参考训练集、验证集还是测试集？";hint1="把测试集想成最后一次正式考试。";hint2="调参通常参考验证集。";hint3="训练集学参数，验证集调参，测试集最终评估。";}
    else {category="待确认";issue="从当前信息还不能可靠确认唯一错因。";question="你觉得自己最不确定的是题意、知识点，还是解题步骤？";hint1="先定位第一处不确定的位置。";hint2="把该位置需要的知识或条件单独写出来。";hint3="再依据这个条件重新完成原题。";}
  }
  return {category,kp,issue,question,hints:[hint1,hint2,hint3]};
}

function startDiagnosis(type,payload, demoCase=null){
  const a= demoCase ? {
    category:demoCase.category,kp:demoCase.kp,issue:demoCase.diagnosis,question:demoCase.question,hints:demoCase.hints
  } : localAnalyze(type,payload);
  state.draft={id:uid("draft"),type,course:payload.course,title:demoCase?.title||payload.task.slice(0,28),payload,analysis:a,demoCaseId:demoCase?.id||null,
    isDemo:!!demoCase,step:2,hintLevel:0,attempts:[]};
  saveState(); renderDiagnosis();
}
function renderDiagnosis(){
  const d=state.draft;if(!d){renderStart();return}
  view.innerHTML=`<div class="card">
    <div class="stepper"><span class="step done">1 输入问题</span><span class="step active">2 诊断追问</span><span class="step">3 分级提示</span><span class="step">4 重新作答</span><span class="step">5 迁移练习</span><span class="step">6 复盘卡</span></div>
    ${d.isDemo?'<div class="warning"><b>示例案例：</b>本次记录会标记为演示数据，不计入真实学习成效。</div>':''}
    <h3>${esc(d.title)}</h3>
    <div class="analysis-box"><h4>初步诊断</h4><p>${esc(d.analysis.issue)}</p><div><span class="tag">${esc(d.analysis.category)}</span> <span class="tag blue">${esc(d.analysis.kp)}</span></div></div>
    <div class="card" style="box-shadow:none;background:#fbfcfd"><h3>先确认你的理解</h3><p>${esc(d.analysis.question)}</p>
      <div class="field"><label>你的回答</label><textarea id="diagAnswer" placeholder="请用自己的话回答"></textarea></div>
      <div class="actions-row"><button class="btn accent" data-action="submit-diagnostic">提交回答</button><button class="ghost-btn" data-action="request-hint">给我一点提示</button></div>
    </div>
  </div>`;
}
function renderHint(){
  const d=state.draft;
  const i=Math.max(1,d.hintLevel);
  const label=["","一级提示：方向","二级提示：关键步骤","三级提示：完整讲解"][i];
  view.innerHTML=`<div class="card">
   <div class="stepper"><span class="step done">1 输入问题</span><span class="step done">2 诊断追问</span><span class="step active">3 分级提示</span><span class="step">4 重新作答</span><span class="step">5 迁移练习</span><span class="step">6 复盘卡</span></div>
   <div class="analysis-box"><h4>${label}</h4><p>${esc(d.analysis.hints[i-1])}</p></div>
   <div class="actions-row"><button class="btn accent" data-action="try-again">我想自己试试</button>${i<3?'<button class="ghost-btn" data-action="request-hint">再给一点提示</button>':''}<button class="ghost-btn" data-action="full-explain">看完整讲解</button></div>
  </div>`;
}
function renderRetry(){
  const d=state.draft;
  view.innerHTML=`<div class="card">
    <div class="stepper"><span class="step done">1 输入问题</span><span class="step done">2 诊断追问</span><span class="step done">3 分级提示</span><span class="step active">4 重新作答</span><span class="step">5 迁移练习</span><span class="step">6 复盘卡</span></div>
    ${d.type==="code"?'<div class="warning">仅静态分析：当前代码不会在服务器或沙箱中执行。</div>':''}
    <h3>请重新完成原题 / 原任务</h3>
    <div class="field"><label>${d.type==="code"?"修改后的代码":"新的作答"}</label><textarea id="retryAnswer" ${d.type==="code"?'class="code" style="min-height:180px"':''}></textarea></div>
    <div class="actions-row"><button class="btn accent" data-action="submit-retry">提交修改</button><button class="ghost-btn" data-action="request-hint">仍需要提示</button></div>
  </div>`;
}
function getPracticeForDraft(){
  const d=state.draft;
  const demo=D.cases.find(x=>x.id===d.demoCaseId);
  if(demo) return demo.practice;
  const kp=d.analysis.kp;
  if(/range|循环/.test(kp)) return {q:"请写出 range(3,8) 产生的所有整数。",answer:"3,4,5,6,7",explanation:"stop=8不包含。"};
  if(/索引/.test(kp)) return {q:"列表 a=[4,5,6,7]，最后一个元素的正索引是多少？",answer:"3",explanation:"长度为4，最大正索引为3。"};
  if(/WHERE|SQL/.test(kp)) return {q:"查询年龄>=20且专业='AI'，请写出WHERE条件。",answer:"age >= 20 AND major='AI'",explanation:"“且”使用AND。"};
  if(/训练/.test(kp)) return {q:"用于模型选择和超参数调整的数据集通常是什么？",answer:"验证集",explanation:"验证集用于调参与模型选择。"};
  return {q:"请用自己的话总结：这次问题的关键知识点是什么？并举一个新的例子。",answer:"开放题：应准确说明知识点，并给出合理新例子。",explanation:"该题需要依据表达完整性判断，必要时可教师复核。",open:true};
}
function renderPracticeStep(){
  const d=state.draft;d.practice=d.practice||getPracticeForDraft();saveState();
  view.innerHTML=`<div class="card">
  <div class="stepper"><span class="step done">1 输入问题</span><span class="step done">2 诊断追问</span><span class="step done">3 分级提示</span><span class="step done">4 重新作答</span><span class="step active">5 迁移练习</span><span class="step">6 复盘卡</span></div>
  <h3>迁移练习</h3><p>先独立完成。提交前不会展示参考答案。</p>
  <div class="analysis-box"><b>${esc(d.practice.q)}</b></div>
  <div class="field"><label>你的答案</label><textarea id="practiceAnswer"></textarea></div>
  <button class="btn accent" data-action="submit-migration">提交迁移练习</button>
  </div>`;
}
function normalize(s){return String(s||"").toLowerCase().replace(/\s+/g,"").replace(/[，。；：'"]/g,"");}
function evaluatePractice(answer,p){
  if(p.open) return {correct:null,feedback:"这是开放题，系统只记录你的作答并标记为“待再次验证”；如需严格评分建议教师复核。",scorable:false};
  const ok=normalize(answer).includes(normalize(p.answer)) || normalize(p.answer).includes(normalize(answer));
  return {correct:ok,feedback:ok?"回答与参考答案一致或核心要点匹配。":"当前答案与参考要点不一致，建议查看解析后再次复习。",scorable:true};
}
function renderPracticeResult(res){
  const d=state.draft;
  view.innerHTML=`<div class="card"><h3>${res.correct===true?"✅ 迁移练习完成":"📌 迁移练习反馈"}</h3>
    <div class="${res.correct===true?"analysis-box":"warning"}"><p>${esc(res.feedback)}</p></div>
    <div class="card" style="box-shadow:none"><h4>参考答案</h4><p>${esc(d.practice.answer)}</p><h4>解析</h4><p>${esc(d.practice.explanation)}</p></div>
    <button class="btn accent" data-action="finish-card">生成并保存复盘卡</button>
  </div>`;
}
function finishCard(){
  const d=state.draft;
  const last=d.attempts[d.attempts.length-1];
  const p=d.practiceResult||{};
  let mastery="待再次验证";
  if(p.correct===true && d.hintLevel===0) mastery="独立完成";
  else if(p.correct===true) mastery="提示后完成";
  else if(d.hintLevel>=3) mastery="需要讲解";
  const now=Date.now();
  const record={
    id:uid("rec"),userId:"local-current-browser",course:d.course,type:d.type,title:d.title,
    originalTask:d.payload.task,originalAnswer:d.payload.answer,originalThought:d.payload.thought||"",
    diagnosis:d.analysis.issue,errorCategory:d.analysis.category,errorConfirmed:!!d.payload.thought,
    knowledgePoint:d.analysis.kp,hintLevel:d.hintLevel,hintsUsed:d.analysis.hints.slice(0,d.hintLevel),
    attempts:d.attempts,finalAnswer:last?.content||"",practice:d.practice,practiceAnswer:d.practiceAnswer||"",
    practiceFeedback:p.feedback||"",masteryStatus:mastery,isDemo:d.isDemo,createdAt:now,
    reviewAt:new Date(now + (mastery==="独立完成"?3:1)*86400000).getTime(),teacherNote:""
  };
  state.records.push(record);
  state.practiceAttempts.push({id:uid("pa"),recordId:record.id,answer:d.practiceAnswer||"",correct:p.correct,scorable:p.scorable,createdAt:now,isDemo:d.isDemo});
  state.reviewTasks.push({id:uid("task"),recordId:record.id,course:d.course,kp:d.analysis.kp,due:record.reviewAt,status:"待复习",lastPerformance:mastery,isDemo:d.isDemo});
  state.draft=null; saveState();
  view.innerHTML=`<div class="card"><div class="tag ${record.isDemo?"warn":""}">${record.isDemo?"演示复盘卡":"复盘卡已保存"}</div>
    <h2>${esc(record.title)}</h2>
    <div class="grid grid-2">
      <div><p><b>课程：</b>${courseName(record.course)}</p><p><b>错因：</b>${esc(record.errorCategory)} ${record.errorConfirmed?"（已结合学生思路）":"（待确认）"}</p><p><b>知识点：</b>${esc(record.knowledgePoint)}</p></div>
      <div><p><b>掌握状态：</b>${record.masteryStatus}</p><p><b>提示级别：</b>${record.hintLevel}</p><p><b>下次复习：</b>${dateOnly(record.reviewAt)}</p></div>
    </div>
    <div class="analysis-box"><h4>具体问题</h4><p>${esc(record.diagnosis)}</p></div>
    <div class="actions-row"><button class="btn accent" data-action="open-record" data-id="${record.id}">查看完整档案</button><button class="ghost-btn" data-route="today">查看今日复习</button><button class="ghost-btn" data-route="home">返回首页</button></div>
  </div>`;
}
function renderArchive(){
  const rows=[...state.records].sort((a,b)=>b.createdAt-a.createdAt);
  view.innerHTML=`<div class="card">
    <div class="form-grid"><div class="field"><label>搜索</label><input id="archiveSearch" placeholder="题目 / 知识点 / 错因"></div>
    <div class="field"><label>课程</label><select id="archiveCourse"><option value="">全部</option>${D.courses.map(c=>`<option value="${c.id}">${c.name}</option>`).join("")}</select></div></div>
    <div class="actions-row"><button class="btn secondary" data-action="filter-archive">筛选</button><button class="ghost-btn" data-action="export-markdown">导出Markdown</button></div>
  </div>
  <div id="archiveList" style="margin-top:16px">${archiveRows(rows)}</div>`;
}
function archiveRows(rows){
  if(!rows.length)return `<div class="empty">暂无复盘记录。</div>`;
  return `<div class="grid grid-2">${rows.map(r=>`<div class="card">
    <div>${r.isDemo?'<span class="tag warn">示例</span>':'<span class="tag">真实本地记录</span>'}</div>
    <h3>${esc(r.title)}</h3><p>${courseName(r.course)} · ${esc(r.knowledgePoint)}</p>
    <div class="kpi-row"><div class="kpi"><small>错因</small><b>${esc(r.errorCategory)}</b></div><div class="kpi"><small>状态</small><b>${r.masteryStatus}</b></div></div>
    <div class="actions-row"><button class="btn secondary" data-action="open-record" data-id="${r.id}">打开</button><button class="ghost-btn" data-action="toggle-fav" data-id="${r.id}">${r.favorite?"★ 已收藏":"☆ 收藏"}</button><button class="ghost-btn" data-action="delete-record" data-id="${r.id}">删除</button></div>
  </div>`).join("")}</div>`;
}
function renderRecord(id){
  const r=state.records.find(x=>x.id===id); if(!r)return;
  view.innerHTML=`<div class="card">
    <div>${r.isDemo?'<span class="tag warn">演示数据</span>':'<span class="tag">本地真实交互记录</span>'}</div>
    <h2>${esc(r.title)}</h2><p class="small">${courseName(r.course)} · ${fmt(r.createdAt)}</p>
    <div class="grid grid-2">
      <div class="card" style="box-shadow:none"><h3>原题 / 任务</h3><p style="white-space:pre-wrap">${esc(r.originalTask)}</p><h4>原始作答</h4><p style="white-space:pre-wrap">${esc(r.originalAnswer)}</p><h4>学生思路</h4><p>${esc(r.originalThought||"未提供")}</p></div>
      <div class="card" style="box-shadow:none"><h3>诊断结果</h3><p>${esc(r.diagnosis)}</p><p><b>错因：</b>${esc(r.errorCategory)} ${r.errorConfirmed?"":"（待确认）"}</p><p><b>知识点：</b>${esc(r.knowledgePoint)}</p><p><b>状态：</b>${r.masteryStatus}</p></div>
    </div>
    <div class="card" style="box-shadow:none;margin-top:14px"><h3>修改过程</h3>${r.attempts.length?r.attempts.map((a,i)=>`<div class="analysis-box"><b>第${i+1}次修改</b><p style="white-space:pre-wrap">${esc(a.content)}</p></div>`).join(""):'<p>无修改记录</p>'}</div>
    <div class="card" style="box-shadow:none;margin-top:14px"><h3>迁移练习</h3><p><b>题目：</b>${esc(r.practice?.q||"")}</p><p><b>学生答案：</b>${esc(r.practiceAnswer)}</p><p><b>反馈：</b>${esc(r.practiceFeedback)}</p></div>
    <div class="field" style="margin-top:14px"><label>个人备注</label><textarea id="recordNote">${esc(r.note||"")}</textarea></div>
    <div class="actions-row"><button class="btn accent" data-action="save-note" data-id="${r.id}">保存备注</button><button class="ghost-btn" data-action="print">打印</button><button class="ghost-btn" data-route="archive">返回档案</button></div>
  </div>`;
}
function renderPractice(){
  const qs=[...D.bank,...state.customQuestions];
  view.innerHTML=`<div class="grid grid-2">
  <div class="card"><h3>开始专项练习</h3><div class="form-grid">
    <div class="field"><label>课程</label><select id="practiceCourse">${D.courses.map(c=>`<option value="${c.id}">${c.name}</option>`).join("")}</select></div>
    <div class="field"><label>难度</label><select id="practiceDiff"><option>基础</option><option>进阶</option><option>挑战</option></select></div>
  </div><div class="actions-row"><button class="btn accent" data-action="start-practice-bank">抽取一道题</button></div></div>
  <div class="card"><h3>题库状态</h3><p>当前共有 <b>${qs.length}</b> 道题，其中教师审核题优先使用。</p><p class="small">AI生成题会明确显示审核状态，不会伪装成教师审核。</p></div></div>
  <div id="practiceArea" style="margin-top:16px"></div>`;
}
function renderToday(){
  const now=Date.now();
  const tasks=[...state.reviewTasks].sort((a,b)=>a.due-b.due);
  view.innerHTML=`<div class="card"><div class="info">复习规则是透明的简单规则：独立完成时延长间隔；回答错误或明显依赖提示时缩短间隔。并不声称是“最优算法”。</div></div>
  <div style="margin-top:16px">${tasks.length?`<div class="list">${tasks.map(t=>`<div class="list-item">
    <div><b>${esc(t.kp)}</b> ${t.isDemo?'<span class="tag warn">演示</span>':''}<div class="meta">${courseName(t.course)} · 上次：${t.lastPerformance} · ${t.due<=now?"已到期":"到期 "+dateOnly(t.due)}</div></div>
    <div class="actions-row" style="margin:0"><button class="btn secondary" data-action="do-review-task" data-id="${t.id}">开始</button><button class="ghost-btn" data-action="delay-task" data-id="${t.id}">延后1天</button><button class="ghost-btn" data-action="skip-task" data-id="${t.id}">跳过</button></div>
  </div>`).join("")}</div>`:`<div class="empty">暂无复习任务。完成一次复盘后会自动生成。</div>`}</div>`;
}
function renderReport(){
  const real=state.records.filter(r=>!r.isDemo), pa=state.practiceAttempts.filter(x=>!x.isDemo && x.scorable);
  const acc=pa.length?Math.round(pa.filter(x=>x.correct).length/pa.length*100):null;
  const cat={}; real.forEach(r=>cat[r.errorCategory]=(cat[r.errorCategory]||0)+1);
  const max=Math.max(1,...Object.values(cat));
  view.innerHTML=`<div class="grid grid-4">
    <div class="card stat"><small>复盘次数</small><strong>${real.length}</strong><span class="small">不含演示案例</span></div>
    <div class="card stat"><small>练习完成</small><strong>${state.practiceAttempts.filter(x=>!x.isDemo).length}</strong></div>
    <div class="card stat"><small>有效正确率</small><strong>${acc===null?"—":acc+"%"}</strong><span class="small">仅含可客观判定题</span></div>
    <div class="card stat"><small>待验证知识点</small><strong>${real.filter(r=>r.masteryStatus!=="独立完成").length}</strong></div>
  </div>
  <div class="grid grid-2" style="margin-top:18px">
    <div class="card"><h3>常见错因分布</h3>${Object.keys(cat).length?`<div class="chart-bars">${Object.entries(cat).map(([k,v])=>`<div class="bar" style="height:${Math.max(20,v/max*130)}px"><span>${esc(k)}(${v})</span></div>`).join("")}</div>`:'<div class="empty">真实记录不足，暂无法形成错因分布。</div>'}</div>
    <div class="card"><h3>趋势说明</h3>${real.length<3?'<div class="warning">当前学习记录较少，暂不足以判断稳定趋势。</div>':'<p>这里只描述真实记录变化，例如提示使用减少、独立完成增加；不会直接宣称“教学效果提升”。</p>'}</div>
  </div>
  <div class="card" style="margin-top:18px"><h3>最近学习活动</h3>${recentRecordsReal()}</div>`;
}
function recentRecordsReal(){
  const rows=state.records.filter(r=>!r.isDemo).sort((a,b)=>b.createdAt-a.createdAt).slice(0,8);
  return rows.length?`<div class="list">${rows.map(r=>`<div class="list-item"><div><b>${esc(r.title)}</b><div class="meta">${esc(r.knowledgePoint)} · ${r.masteryStatus}</div></div><span>${fmt(r.createdAt)}</span></div>`).join("")}</div>`:'<div class="empty">暂无真实学习活动。</div>';
}
function renderTeacher(){
  view.innerHTML=`<div class="warning"><b>教师工作台为比赛演示环境。</b>纯前端版没有服务器级教师身份认证，因此不会宣称具备真实多用户权限隔离。这里用于展示教师审核闭环，数据只保存在当前浏览器。</div>
  <div class="grid grid-3" style="margin-top:16px">
    <div class="card"><h3>待审核复盘</h3><strong style="font-size:28px">${state.records.filter(r=>!r.teacherReviewed).length}</strong><p>可修订错因、评价和备注。</p></div>
    <div class="card"><h3>题库待审核</h3><strong style="font-size:28px">${[...D.bank,...state.customQuestions].filter(q=>String(q.reviewStatus).includes("待")).length}</strong></div>
    <div class="card"><h3>审核记录</h3><strong style="font-size:28px">${state.teacherReviews.length}</strong></div>
  </div>
  <div class="card" style="margin-top:16px"><h3>学生主动提交/演示记录</h3>${teacherRecordList()}</div>
  <div class="card" style="margin-top:16px"><h3>真实审核日志</h3>${teacherReviewLog()}</div>`;
}
function teacherRecordList(){
  if(!state.records.length)return `<div class="empty">暂无记录。</div>`;
  return `<div class="list">${state.records.slice().reverse().map(r=>`<div class="list-item"><div><b>${esc(r.title)}</b> ${r.isDemo?'<span class="tag warn">演示</span>':''}<div class="meta">${esc(r.errorCategory)} · ${r.teacherReviewed?"已审核":"待审核"}</div></div><button class="btn secondary" data-action="teacher-review" data-id="${r.id}">审核</button></div>`).join("")}</div>`;
}
function teacherReviewLog(){
  if(!state.teacherReviews.length)return `<div class="empty">暂无审核日志。</div>`;
  return `<div class="list">${state.teacherReviews.slice().reverse().map(x=>`<div class="list-item"><div><b>${esc(x.targetTitle)}</b><div class="meta">教师角色 · ${fmt(x.createdAt)} · ${esc(x.reason)}</div></div><span class="tag">已真实保存</span></div>`).join("")}</div>`;
}
function renderResources(){
  const qs=[...D.bank,...state.customQuestions];
  view.innerHTML=`<div class="grid grid-2">
    <div class="card"><div class="section-head"><div><h3>课程资料</h3><p>纯前端版仅保存资料元信息与文本，不做真实服务器RAG。</p></div></div>
    <div class="list">${D.materials.map(m=>`<div class="list-item"><div><b>${esc(m.title)}</b><div class="meta">${courseName(m.course)} · ${esc(m.source)} · 示例资料</div></div></div>`).join("")}</div></div>
    <div class="card"><h3>添加题目（教师演示）</h3>
      <div class="field"><label>课程</label><select id="newQCourse">${D.courses.map(c=>`<option value="${c.id}">${c.name}</option>`).join("")}</select></div>
      <div class="field"><label>知识点</label><input id="newQKp"></div>
      <div class="field"><label>题目</label><textarea id="newQQ"></textarea></div>
      <div class="field"><label>参考答案</label><textarea id="newQA"></textarea></div>
      <button class="btn accent" data-action="add-question">保存为待审核题目</button>
    </div>
  </div>
  <div class="card" style="margin-top:16px"><h3>题库</h3><div class="table-wrap"><table class="table"><thead><tr><th>课程</th><th>知识点</th><th>题型</th><th>状态</th></tr></thead><tbody>${qs.map(q=>`<tr><td>${courseName(q.course)}</td><td>${esc(q.kp)}</td><td>${esc(q.type)}</td><td>${esc(q.reviewStatus)}</td></tr>`).join("")}</tbody></table></div></div>`;
}
function renderSettings(){
  view.innerHTML=`<div class="grid grid-2">
  <div class="card"><h3>本地数据与隐私</h3>
    <p>本比赛版把学习记录保存在当前浏览器 localStorage 中，不上传到服务器。换设备或清除浏览器数据后记录不会自动同步。</p>
    <div class="actions-row"><button class="ghost-btn" data-action="export-json">导出备份</button><button class="btn danger" data-action="clear-data">清空本地数据</button></div>
  </div>
  <div class="card"><h3>可选高级AI模式</h3><p>为了避免把模型密钥暴露在公开GitHub仓库，本项目默认不开启真实在线大模型调用。比赛基础演示完全无需API。</p>
    <div class="warning">如果将API Key直接用于纯前端网页，请理解：浏览器侧调用无法获得服务器级密钥保护。仅建议使用临时、低额度测试Key。</div>
    <div class="field" style="margin-top:12px"><label>临时API Key（仅保存在当前浏览器）</label><input id="apiKey" type="password" value="${esc(state.settings.apiKey||"")}" placeholder="可留空"></div>
    <button class="btn secondary" data-action="save-api-key">保存本地设置</button>
  </div></div>
  <div class="card" style="margin-top:16px"><h3>比赛版明确限制</h3>
  <ul><li>无服务器级多用户账号与身份隔离。</li><li>无真正教师账号权限；教师工作台为本地演示闭环。</li><li>代码纠错为静态分析，未接入安全代码执行沙箱。</li><li>未接入离线通知服务。</li><li>课程资料不进行服务器端向量知识库检索。</li></ul></div>`;
}
function startDemo(){
  const cards=D.cases.map(c=>`<div class="card"><span class="tag warn">示例案例</span><h3>${esc(c.title)}</h3><p>${courseName(c.course)}</p><button class="btn secondary" data-action="launch-demo-case" data-id="${c.id}">开始体验</button></div>`).join("");
  view.innerHTML=`<div class="card hero"><h2>智能体验模式</h2><p>选择一个案例，评委可以真实输入回答。过程会生成演示复盘卡，但不会计入真实学习成效。</p></div><div class="grid grid-3" style="margin-top:16px">${cards}</div>`;
  pageTitle.textContent="智能体验";pageEyebrow.textContent=
}
function launchDemo(id){
  const c=D.cases.find(x=>x.id===id);if(!c)return;
  const payload={course:c.course,task:c.prompt,answer:c.originalAnswer,thought:c.thought,kp:c.kp};
  startDiagnosis(c.type,payload,c);
}
function openTeacherReview(id){
  const r=state.records.find(x=>x.id===id);if(!r)return;
  openModal(`<div class="modal-head"><h3>教师审核：${esc(r.title)}</h3><button class="icon-btn" data-action="close-modal">✕</button></div>
  <div class="field"><label>错因分类</label><select id="trCategory">${["概念理解","条件识别","方法选择","推理步骤","计算或操作","表达不完整","代码语法","代码逻辑","知识迁移","待确认"].map(x=>`<option ${x===r.errorCategory?"selected":""}>${x}</option>`).join("")}</select></div>
  <div class="field"><label>教师修订说明 *</label><textarea id="trReason" placeholder="例如：结合学生思路，将错因从待确认修订为条件识别"></textarea></div>
  <div class="field"><label>教师备注</label><textarea id="trNote">${esc(r.teacherNote||"")}</textarea></div>
  <button class="btn accent" data-action="save-teacher-review" data-id="${r.id}">保存审核</button>`);
}
function openModal(html){$("#modalRoot").innerHTML=`<div class="modal-backdrop"><div class="modal">${html}</div></div>`}
function closeModal(){$("#modalRoot").innerHTML=""}

async function handleAction(action,el){
  if(action==="start-demo") return startDemo();
  if(action==="open-help") return navigate("settings");
  if(action==="start-type"){ state.draft={type:el.dataset.type}; saveState(); return renderStart(el.dataset.type); }
  if(action==="switch-type") return renderStart(el.dataset.type);
  if(action==="launch-demo-case") return launchDemo(el.dataset.id);
  if(action==="submit-review"){
    const type=el.dataset.type;
    const payload={course:$("#course").value,task:$("#task")?.value.trim(),answer:$("#answer")?.value.trim()||"",thought:$("#thought")?.value.trim()||"",expected:$("#expected")?.value.trim()||"",kp:$("#kp")?.value.trim()||"",error:$("#error")?.value.trim()||""};
    if(!payload.task || (type!=="project" && !payload.answer)){toast("请先补充必填信息");return}
    return startDiagnosis(type,payload);
  }
  if(action==="submit-diagnostic"){
    const v=$("#diagAnswer").value.trim();if(!v){toast("请先写下你的回答");return}
    state.draft.diagnosticAnswer=v;state.draft.step=3;saveState();
    state.draft.hintLevel=1;saveState();return renderHint();
  }
  if(action==="request-hint"){state.draft.hintLevel=Math.min(3,(state.draft.hintLevel||0)+1);saveState();return renderHint();}
  if(action==="full-explain"){state.draft.hintLevel=3;saveState();return renderHint();}
  if(action==="try-again") return renderRetry();
  if(action==="submit-retry"){
    const v=$("#retryAnswer").value.trim();if(!v){toast("请先提交你的修改");return}
    state.draft.attempts.push({content:v,createdAt:Date.now(),hintLevel:state.draft.hintLevel});state.draft.step=5;saveState();return renderPracticeStep();
  }
  if(action==="submit-migration"){
    const v=$("#practiceAnswer").value.trim();if(!v){toast("请先完成迁移练习");return}
    const res=evaluatePractice(v,state.draft.practice);state.draft.practiceAnswer=v;state.draft.practiceResult=res;saveState();return renderPracticeResult(res);
  }
  if(action==="finish-card") return finishCard();
  if(action==="open-record") return renderRecord(el.dataset.id);
  if(action==="toggle-fav"){const r=state.records.find(x=>x.id===el.dataset.id);r.favorite=!r.favorite;saveState();return renderArchive();}
  if(action==="delete-record"){if(confirm("确认删除这条复盘记录？")){state.records=state.records.filter(x=>x.id!==el.dataset.id);saveState();renderArchive();}return}
  if(action==="save-note"){const r=state.records.find(x=>x.id===el.dataset.id);r.note=$("#recordNote").value;saveState();toast("备注已保存");return}
  if(action==="print") return window.print();
  if(action==="filter-archive"){const q=$("#archiveSearch").value.trim().toLowerCase(),c=$("#archiveCourse").value;let rows=state.records.filter(r=>(!c||r.course===c)&&(!q||JSON.stringify(r).toLowerCase().includes(q)));$("#archiveList").innerHTML=archiveRows(rows);return}
  if(action==="export-markdown"){
    const md=state.records.map(r=>`# ${r.title}\n- 课程：${courseName(r.course)}\n- 知识点：${r.knowledgePoint}\n- 错因：${r.errorCategory}\n- 状态：${r.masteryStatus}\n\n## 原题\n${r.originalTask}\n\n## 原答案\n${r.originalAnswer}\n\n## 诊断\n${r.diagnosis}\n\n## 最终作答\n${r.finalAnswer}\n\n---\n`).join("\n");
    return download("复盘侠-复盘档案.md",md,"text/markdown");
  }
  if(action==="start-practice-bank"){
    const c=$("#practiceCourse").value;const pool=[...D.bank,...state.customQuestions].filter(q=>q.course===c);if(!pool.length){toast("当前课程暂无题目");return}
    const q=pool[Math.floor(Math.random()*pool.length)];
    $("#practiceArea").innerHTML=`<div class="card"><span class="tag ${String(q.reviewStatus).includes("待")?"warn":""}">${esc(q.reviewStatus)}</span><h3>${esc(q.q)}</h3>
      ${q.options?`<div class="field"><label>选择答案</label><select id="bankAnswer">${q.options.map(o=>`<option>${esc(o)}</option>`).join("")}</select></div>`:`<div class="field"><label>你的答案</label><textarea id="bankAnswer"></textarea></div>`}
      <button class="btn accent" data-action="submit-bank" data-id="${q.id}">提交</button></div>`;
    return;
  }
  if(action==="submit-bank"){
    const q=[...D.bank,...state.customQuestions].find(x=>x.id===el.dataset.id);const v=$("#bankAnswer").value.trim();
    let scorable=["单选题","判断题"].includes(q.type);let correct=scorable?normalize(v)===normalize(q.answer):null;
    state.practiceAttempts.push({id:uid("pa"),questionId:q.id,answer:v,correct,scorable,createdAt:Date.now(),isDemo:false});saveState();
    $("#practiceArea").innerHTML=`<div class="card"><h3>练习反馈</h3><p>${scorable?(correct?"✅ 回答正确":"❌ 与参考答案不一致"):"已记录作答。简答/代码题在没有可靠自动评分标准时不强行判定。"}</p><p><b>参考答案：</b>${esc(q.answer)}</p><p>${esc(q.explanation||"")}</p></div>`;return
  }
  if(action==="do-review-task"){
    const t=state.reviewTasks.find(x=>x.id===el.dataset.id);const r=state.records.find(x=>x.id===t.recordId);if(!r)return;
    state.draft={type:r.type,course:r.course,title:"复习："+r.title,payload:{course:r.course,task:r.originalTask,answer:r.finalAnswer||r.originalAnswer,thought:"这是一次到期复习。",kp:r.knowledgePoint},analysis:{category:r.errorCategory,kp:r.knowledgePoint,issue:"请通过新的迁移练习验证是否仍能独立完成。",question:"先用一句话说出这个知识点最关键的规则。",hints:["回忆上次的核心规则。","回忆你上次出错的具体位置。","查看原复盘卡后再完成新题。"]},isDemo:t.isDemo,step:2,hintLevel:0,attempts:[]};saveState();return renderDiagnosis();
  }
  if(action==="delay-task"){const t=state.reviewTasks.find(x=>x.id===el.dataset.id);t.due+=86400000;saveState();renderToday();return}
  if(action==="skip-task"){const t=state.reviewTasks.find(x=>x.id===el.dataset.id);t.status="已跳过";saveState();renderToday();return}
  if(action==="teacher-review") return openTeacherReview(el.dataset.id);
  if(action==="close-modal") return closeModal();
  if(action==="save-teacher-review"){
    const r=state.records.find(x=>x.id===el.dataset.id),reason=$("#trReason").value.trim();if(!reason){toast("请填写修订说明");return}
    const old=r.errorCategory,newc=$("#trCategory").value;r.errorCategory=newc;r.teacherNote=$("#trNote").value;r.teacherReviewed=true;
    state.teacherReviews.push({id:uid("tr"),targetId:r.id,targetTitle:r.title,originalContent:old,revisedContent:newc,reason,createdAt:Date.now(),role:"教师"});saveState();closeModal();renderTeacher();toast("教师审核已保存");return;
  }
  if(action==="add-question"){
    const q=$("#newQQ").value.trim(),a=$("#newQA").value.trim();if(!q||!a){toast("请填写题目和参考答案");return}
    state.customQuestions.push({id:uid("q"),course:$("#newQCourse").value,kp:$("#newQKp").value.trim()||"未分类",type:"简答题",difficulty:"基础",q,answer:a,explanation:"教师演示新增题目",reviewStatus:"待审核"});saveState();renderResources();toast("题目已保存");return
  }
  if(action==="export-json") return download("fupanxia-backup.json",JSON.stringify(state,null,2),"application/json");
  if(action==="clear-data"){if(confirm("将清空当前浏览器中的全部复盘侠数据，是否继续？")){state=structuredClone(defaultState);saveState();navigate("home")}return}
  if(action==="save-api-key"){state.settings.apiKey=$("#apiKey").value.trim();saveState();toast("仅已保存到当前浏览器");return}
}
function download(name,content,type){
  const blob=new Blob([content],{type});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
renderNav();renderHome();
