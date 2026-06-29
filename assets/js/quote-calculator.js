
/* Phase 8 — guided quote calculator. Orientation only; final quote is confirmed in writing. */
(function(){
  "use strict";
  var VAT = 0.20;
  var EU_PREFIXES = ['BE','BG','CZ','DK','DE','EE','IE','EL','GR','ES','FR','HR','IT','CY','LV','LT','LU','HU','MT','NL','PL','PT','RO','SI','SK','FI','SE'];
  var labels = {
    en:{net:'Net',vat:'VAT',gross:'Gross',vat20:'20% Austrian VAT included.',reverse:'EU B2B outside Austria: reverse charge / 0% VAT estimate.'},
    hu:{net:'Nettó',vat:'ÁFA',gross:'Bruttó',vat20:'20% osztrák ÁFA-val számolva.',reverse:'Ausztrián kívüli EU-s céges adószám: fordított adózás / 0% ÁFA becslés.'},
    de:{net:'Netto',vat:'USt.',gross:'Brutto',vat20:'Inklusive 20% österreichischer USt.',reverse:'EU-Unternehmen außerhalb Österreichs: Reverse Charge / 0% USt.-Schätzung.'}
  };
  var pricesGross = {
    quick30:220, guided60:420, guided120:690,
    groupSetup:390, groupPerson:45, groupInstantBase:690, groupInstantPerson:55,
    brand60:590, brand120:890, brand180:1190, brand240:1490,
    art60:490, art120:790, art180:1090,
    retouchPortrait:35, retouchGroup:29, retouchArt:45,
    stylist:220, hair:220, makeup:220, express:120, mobile:240, artdirection:260,
    extraPhotographer:350
  };
  function money(v){ return '€' + Math.round(v).toLocaleString('de-DE'); }
  function checked(form,name){ return Array.prototype.slice.call(form.querySelectorAll('[name="'+name+'"]:checked')).map(function(i){return i.value;}); }
  function val(form,name, fallback){ var el=form.querySelector('[name="'+name+'"]:checked')||form.querySelector('[name="'+name+'"]'); return el ? el.value : fallback; }
  function num(form,name,fallback){ var el=form.querySelector('[name="'+name+'"]'); var n=el?parseInt(el.value,10):fallback; return isNaN(n)?fallback:n; }
  function isReverseCharge(vatid, company){
    var raw=(vatid||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
    if(!company || raw.length<4) return false;
    var prefix=raw.slice(0,2);
    return prefix !== 'AT' && EU_PREFIXES.indexOf(prefix) !== -1;
  }
  function updatePanels(form){
    var cat=val(form,'category','individual');
    form.querySelectorAll('[data-panel]').forEach(function(p){ p.hidden = p.getAttribute('data-panel') !== cat; });
    var delivery=val(form,'group_delivery','later');
    var people=form.querySelector('[name="people_count"]');
    if(cat==='group' && delivery==='instant' && people && parseInt(people.value,10)>6){ people.value=6; }
    if(people){ people.max = (cat==='group' && delivery==='instant') ? 6 : 200; }
  }
  function calc(form){
    updatePanels(form);
    var cat=val(form,'category','individual');
    var gross=0, parts=[];
    var retouches=Math.max(1,num(form,'retouched_images',1));
    if(cat==='individual'){
      var m=val(form,'individual_mode','quick30'); gross += pricesGross[m] || pricesGross.quick30; parts.push(m);
      if(retouches>1){ gross += (retouches-1)*pricesGross.retouchPortrait; parts.push('extra retouched images: '+(retouches-1)); }
    } else if(cat==='group'){
      var people=Math.max(1,num(form,'people_count',6)); var delivery=val(form,'group_delivery','later'); var photographers=Math.max(1,num(form,'photographers',1));
      if(delivery==='instant'){ people=Math.min(people,6); gross += pricesGross.groupInstantBase + people*pricesGross.groupInstantPerson; parts.push('instant retouching, '+people+' people'); }
      else { gross += pricesGross.groupSetup + people*pricesGross.groupPerson + retouches*pricesGross.retouchGroup; parts.push('later retouching, '+people+' people'); }
      if(photographers>1){ gross += (photographers-1)*pricesGross.extraPhotographer; parts.push('additional photographers: '+(photographers-1)); }
    } else if(cat==='brand'){
      var b=val(form,'brand_duration','brand60'); gross += pricesGross[b] || pricesGross.brand60; parts.push(b);
      gross += Math.max(0,retouches-3)*pricesGross.retouchPortrait; parts.push('retouched images: '+retouches);
    } else if(cat==='art'){
      var a=val(form,'art_duration','art60'); gross += pricesGross[a] || pricesGross.art60; parts.push(val(form,'art_type','artportrait'));
      gross += Math.max(0,retouches-2)*pricesGross.retouchArt; parts.push('retouched images: '+retouches);
    }
    var teamPhotographers=Math.max(1,num(form,'project_photographers',1)); if(teamPhotographers>1){ gross += (teamPhotographers-1)*pricesGross.extraPhotographer; parts.push('project photographers: '+teamPhotographers); }
    checked(form,'addons').forEach(function(ad){ gross += pricesGross[ad] || 0; parts.push(ad); });
    var company=(form.querySelector('[name="company"]')||{}).value||'';
    var reverse=isReverseCharge((form.querySelector('[data-vat-id]')||{}).value||'', company);
    var net = gross/(1+VAT);
    var vat = reverse ? 0 : gross-net;
    var total = reverse ? net : gross;
    return {gross: total, net: net, vat: vat, reverse: reverse, parts: parts.join(', ')};
  }
  function paint(form){
    var lang=form.getAttribute('data-lang')||'en'; var l=labels[lang]||labels.en; var c=calc(form);
    var box=document.querySelector('[data-quote-summary]'); if(!box) return;
    box.classList.toggle('reverse', c.reverse);
    var total=box.querySelector('[data-total]'), net=box.querySelector('[data-net]'), vat=box.querySelector('[data-vat]'), note=box.querySelector('[data-vat-note]');
    if(total) total.textContent=money(c.gross); if(net) net.textContent=money(c.net); if(vat) vat.textContent=money(c.vat); if(note) note.textContent=c.reverse?l.reverse:l.vat20;
    var hNet=form.querySelector('[data-estimate-net]'), hVat=form.querySelector('[data-estimate-vat]'), hGross=form.querySelector('[data-estimate-gross]'), hMode=form.querySelector('[data-estimate-vat-mode]'), hSummary=form.querySelector('[data-estimate-summary]');
    if(hNet) hNet.value=Math.round(c.net); if(hVat) hVat.value=Math.round(c.vat); if(hGross) hGross.value=Math.round(c.gross); if(hMode) hMode.value=c.reverse?'reverse-charge-0-vat':'austrian-vat-20'; if(hSummary) hSummary.value=c.parts;
  }
  document.querySelectorAll('[data-smart-quote]').forEach(function(form){
    form.addEventListener('input', function(){ paint(form); });
    form.addEventListener('change', function(){ paint(form); });
    form.addEventListener('submit', function(){ paint(form); });
    paint(form);
  });
})();
