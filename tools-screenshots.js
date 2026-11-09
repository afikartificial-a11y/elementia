const { chromium } = require('playwright-core');
const [base, out, ...pages] = process.argv.slice(2);
(async()=>{
  const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
  for(const [w,h,mob] of [[1440,900,false],[1024,800,false],[768,1024,true],[390,844,true]]){
    const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:mob,hasTouch:mob});
    const p=await ctx.newPage();
    for(const n of pages){
      await p.goto(`${base}/${n}`,{waitUntil:'networkidle'}).catch(e=>console.log('ERR',n,e.message));
      await p.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('is-in')));
      await p.evaluate(async()=>{document.querySelectorAll('img').forEach(i=>i.loading='eager');for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60))}window.scrollTo(0,0)});
      await p.waitForTimeout(400);
      const info=await p.evaluate(()=>{const g=s=>{const e=document.querySelector(s);if(!e)return null;const c=getComputedStyle(e);return c.fontSize+'/'+c.fontFamily.split(',')[0]};return {ov:document.documentElement.scrollWidth-innerWidth,html:getComputedStyle(document.documentElement).fontSize,body:g('body'),h1:g('h1'),h2:g('h2'),p:g('main p, p'),dev:document.documentElement.dataset.device||document.body.dataset.device||'', css:[...document.styleSheets].map(s=>s.href&&s.href.split('/').pop()).filter(Boolean).join(' ')}});
      console.log(n,w,JSON.stringify(info));
      await p.screenshot({path:`${out}/${n.replace('.html','')}-${w}.png`,fullPage:true});
    }
    await ctx.close();
  }
  await b.close();
})();
