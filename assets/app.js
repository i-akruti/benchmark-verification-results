(() => {
  'use strict';
  const data = window.STUDY_DATA;
  if (!data) return;
  const modelColors = {
    'Jev 1.14': '#268c7a',
    'Decider': '#6382bb',
    'GPT-5.4 mini': '#b48d51',
    'GPT-5.4': '#a078ad',
    'Claude Sonnet 4.6': '#ce794f'
  };
  const $ = (s) => document.querySelector(s);
  const fmt3 = (x) => Number(x).toFixed(3);
  const pct = (x) => `${Math.round(x * 100)}%`;
  const $money = (x) => `$${Number(x).toFixed(3)}`;
  let dataset = 'mmlu';
  let sweMetric = 'tests_reject_valid';
  let costMode = 'validity';
  let budget = 20;
  const visible = new Set(data.models);
  const svgNS = 'http://www.w3.org/2000/svg';

  function setDataset(choice) {
    dataset = choice;
    $('#mmlu-tab').classList.toggle('active', dataset === 'mmlu');
    $('#swe-tab').classList.toggle('active', dataset === 'swe');
    $('#mmlu-tab').setAttribute('aria-pressed', String(dataset === 'mmlu'));
    $('#swe-tab').setAttribute('aria-pressed', String(dataset === 'swe'));
    $('#swe-controls').classList.toggle('hidden', dataset !== 'swe');
    renderAuroc();
  }

  function renderAuroc() {
    const el = $('#auroc-chart');
    el.textContent = '';
    for (const model of [...data.models].sort((a, b) => {
      const va = dataset === 'mmlu' ? data.modelData[a].mmlu.auroc : data.modelData[a].swe[sweMetric].auroc;
      const vb = dataset === 'mmlu' ? data.modelData[b].mmlu.auroc : data.modelData[b].swe[sweMetric].auroc;
      return vb - va;
    })) {
      const d = dataset === 'mmlu' ? data.modelData[model].mmlu : data.modelData[model].swe[sweMetric];
      const row = document.createElement('div'); row.className = 'auroc-row';
      const label = document.createElement('div'); label.className = 'auroc-model'; label.textContent = model;
      const track = document.createElement('div'); track.className = 'auroc-track';
      track.setAttribute('role', 'img'); track.setAttribute('aria-label', `${model}, AUROC ${fmt3(d.auroc)}, 95% interval ${fmt3(d.ci[0])} to ${fmt3(d.ci[1])}`);
      const bar = document.createElement('div'); bar.className = 'auroc-bar';
      bar.style.width = `${d.auroc * 100}%`; bar.style.background = modelColors[model];
      const ciLine = document.createElement('div'); ciLine.className = 'auroc-ci'; ciLine.style.left = `${d.ci[0] * 100}%`; ciLine.style.width = `${(d.ci[1] - d.ci[0]) * 100}%`;
      const lo = document.createElement('div'); lo.className = 'auroc-whisker'; lo.style.left = `${d.ci[0] * 100}%`;
      const hi = document.createElement('div'); hi.className = 'auroc-whisker'; hi.style.left = `${d.ci[1] * 100}%`;
      track.append(bar, ciLine, lo, hi);
      const value = document.createElement('strong'); value.className = 'auroc-number'; value.textContent = fmt3(d.auroc);
      row.append(label, track, value); el.append(row);
    }
    $('#auroc-note').textContent = dataset === 'mmlu'
      ? 'MMLU-Redux 2.0 · population-weighted sample, 995 items (338 defective; 57 subjects).'
      : 'SWE-bench annotations · weighted sample, 300 tasks across 11 repositories. Labels are engineer judgments.';
    $('#auroc-insight').textContent = dataset === 'mmlu'
      ? 'Jev and Claude have close point estimates on MMLU. Their paired AUROC difference is +0.004 [−0.016, +0.024].'
      : sweMetric === 'tests_reject_valid'
        ? 'Decider exceeds Claude by +0.073 AUROC on test-validity labels. Paired 95% CI: [+0.032, +0.116].'
        : sweMetric === 'exclude'
          ? 'Decider exceeds Claude by +0.064 AUROC on exclusion labels. Paired 95% CI: [+0.022, +0.106].'
          : 'Underspecification remains difficult: no model recalls more than 5% of labeled cases at a 0.5 cutoff.';
  }

  function svgEl(tag, attrs, text) {
    const e = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, String(v));
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function renderLegend() {
    const el = $('#budget-legend'); el.textContent = '';
    for (const model of data.models) {
      const btn = document.createElement('button'); btn.className = `legend-toggle${visible.has(model) ? ' active' : ''}`;
      btn.type = 'button'; btn.setAttribute('aria-pressed', String(visible.has(model))); btn.title = `Toggle ${model}`;
      const swatch = document.createElement('span'); swatch.className = 'legend-swatch'; swatch.style.background = modelColors[model];
      const label = document.createElement('span'); label.textContent = model;
      btn.append(swatch, label);
      btn.addEventListener('click', () => {
        if (visible.has(model) && visible.size === 1) return;
        if (visible.has(model)) visible.delete(model); else visible.add(model);
        renderLegend(); renderBudget();
      });
      el.append(btn);
    }
  }
  function renderBudget() {
    const svg = $('#budget-plot'); svg.textContent = '';
    const W=620, H=340, left=58, top=22, right=16, bottom=47;
    const pw=W-left-right, ph=H-top-bottom;
    const X=(x)=>left+(x/.5)*pw;
    const Y=(y)=>top+(1-y)*ph;
    for (let k=0;k<=5;k++) {
      const val=k*.2;
      svg.append(svgEl('line',{x1:left,y1:Y(val),x2:W-right,y2:Y(val),class:'plot-grid'}));
      svg.append(svgEl('text',{x:left-13,y:Y(val)+4,'text-anchor':'end',class:'plot-axis'},`${Math.round(val*100)}%`));
    }
    for (let k=0;k<=5;k++) {
      const val=k*.1;
      svg.append(svgEl('line',{x1:X(val),y1:top,x2:X(val),y2:H-bottom,class:'plot-grid'}));
      svg.append(svgEl('text',{x:X(val),y:H-bottom+20,'text-anchor':'middle',class:'plot-axis'},`${Math.round(val*100)}%`));
    }
    svg.append(svgEl('text',{x:W/2,y:H-7,'text-anchor':'middle',class:'plot-axis-title'},'Population review budget'));
    svg.append(svgEl('text',{x:15,y:H/2,transform:`rotate(-90,15,${H/2})`,'text-anchor':'middle',class:'plot-axis-title'},'Defect recall'));
    let randomPts = '';for(let i=0;i<=50;i++){let b=i/100;randomPts+=`${i===0?'M':'L'}${X(b).toFixed(1)},${Y(b).toFixed(1)} `;}
    svg.append(svgEl('path',{d:randomPts,fill:'none',stroke:'#9ba9a2','stroke-width':'1.8','stroke-dasharray':'5 6'}));
    for (const model of data.models) {
      if (!visible.has(model)) continue;
      const points=data.review[model];
      const path=points.map(([x,y],i)=>`${i?'L':'M'}${X(x).toFixed(2)},${Y(y).toFixed(2)}`).join(' ');
      svg.append(svgEl('path',{d:path,fill:'none',stroke:modelColors[model],'stroke-width':'2.75','stroke-linecap':'round','stroke-linejoin':'round'}));
      const selected=points[budget];
      if(selected) svg.append(svgEl('circle',{cx:X(selected[0]),cy:Y(selected[1]),r:5.1,fill:modelColors[model],stroke:'#fff','stroke-width':2}));
    }
    svg.append(svgEl('line',{x1:X(budget/100),y1:top,x2:X(budget/100),y2:H-bottom,class:'plot-cursor'}));
    const legendLabel=svgEl('text',{x:W-right-3,y:top+11,'text-anchor':'end',class:'plot-axis'},'— Random review');
    svg.append(legendLabel);
    $('#budget-value').textContent = `${budget}% of population`;
    $('#budget-badge').textContent = `${budget}%`;
    const readout = $('#budget-readout'); readout.textContent='';
    for(const model of data.models) {
      if(!visible.has(model))continue;
      const value=data.review[model][budget][1];
      const row=document.createElement('div'); row.className='readout-row';
      const label=document.createElement('span'); label.className='label';
      const swatch=document.createElement('span');swatch.className='legend-swatch';swatch.style.background=modelColors[model];
      label.append(swatch,document.createTextNode(model));
      const amount=document.createElement('strong');amount.textContent=`${(value*100).toFixed(1)}%`;
      row.append(label,amount);readout.append(row);
    }
  }

  function renderCost() {
    const el=$('#cost-bars');el.textContent='';
    const rows=data.models.map(model=>({model,value:data.modelData[model].cost[costMode]}));
    const max=Math.max(...rows.map(o=>o.value));
    rows.sort((a,b)=>a.value-b.value);
    for(const row of rows){
      const container=document.createElement('div');container.className='cost-row';
      const label=document.createElement('span');label.className='cost-name';label.textContent=row.model;
      const track=document.createElement('div');track.className='cost-track';
      const bar=document.createElement('div');bar.className='cost-fill';bar.style.width=`${row.value/max*100}%`;bar.style.background=modelColors[row.model];
      track.append(bar);const value=document.createElement('span');value.className='cost-value';value.textContent=$money(row.value);
      container.append(label,track,value);el.append(container);
    }
    $('#cost-caption').textContent=costMode==='validity'?'MMLU validity judgment only':costMode==='both'?'MMLU validity + answer calls':'SWE-bench task judgments';
    document.querySelectorAll('.cost-btn').forEach(btn=>{
      const active=btn.dataset.cost===costMode;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
    });
  }

  $('#mmlu-tab').addEventListener('click',()=>setDataset('mmlu'));
  $('#swe-tab').addEventListener('click',()=>setDataset('swe'));
  $('#swe-metric').addEventListener('change',e=>{sweMetric=e.target.value;renderAuroc()});
  $('#budget-range').addEventListener('input',e=>{budget=Number(e.target.value);renderBudget()});
  document.querySelectorAll('.cost-btn').forEach(btn=>btn.addEventListener('click',()=>{costMode=btn.dataset.cost;renderCost()}));
  renderAuroc(); renderLegend(); renderBudget(); renderCost();
})();
