/* NORBERTBANHALMI.COM — minimal interactions. No analytics loads before consent. */
(function () {
  "use strict";

  window.BANHALMI_QUOTE_ENDPOINT = window.BANHALMI_QUOTE_ENDPOINT || "https://script.google.com/macros/s/AKfycbxEKirKLCWjcO8pPbyo2uJt0HqS2DuCqul2H9b0UkAh9Brc61WC7Q4wh4MhwSMpiw/exec";
  window.BANHALMI_CONTACT_ENDPOINT = window.BANHALMI_CONTACT_ENDPOINT || "https://script.google.com/macros/s/AKfycbxEKirKLCWjcO8pPbyo2uJt0HqS2DuCqul2H9b0UkAh9Brc61WC7Q4wh4MhwSMpiw/exec";

  // Mobile menu
  var nav = document.querySelector(".nav");
  var btn = document.querySelector(".menu-btn");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", nav.classList.contains("open"));
    });
    nav.querySelectorAll(".nav-links a, .lang-switch a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Scroll reveal (respects reduced motion)
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var items = document.querySelectorAll(".reveal");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // Cookie consent gate. No marketing or analytics script
  // may load before consent is given. Wire any future scripts inside grant().
  var KEY = "banhalmi_consent";
  var bar = document.querySelector(".cookie");
  function decided() { try { return localStorage.getItem(KEY); } catch (e) { return "essential"; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function grant() {
    /* Consented (analytics/marketing) script loaders go here.
       TrustIndex review widget — loads ONLY after consent (GDPR: no third-party
       CDN/cookies before the user agrees). Guarded so it injects at most once. */
    if (!document.getElementById("trustindex-richsnippet")) {
      var ti = document.createElement("script");
      ti.id = "trustindex-richsnippet";
      ti.type = "text/javascript";
      ti.defer = true;
      ti.async = true;
      ti.src = "https://cdn.trustindex.io/assets/js/richsnippet.js?c307c9433572g62e";
      document.head.appendChild(ti);
    }
  }
  if (bar) {
    if (!decided()) { bar.classList.add("show"); }
    else if (decided() === "all") { grant(); }
    var accept = bar.querySelector("[data-accept]");
    var decline = bar.querySelector("[data-decline]");
    if (accept) accept.addEventListener("click", function () { set("all"); bar.classList.remove("show"); grant(); });
    if (decline) decline.addEventListener("click", function () { set("essential"); bar.classList.remove("show"); });
  }



  // Budget guidance for the guided quote builder
  document.querySelectorAll('[data-budget-select]').forEach(function(sel){
    var box = document.querySelector(sel.getAttribute('data-target'));
    var lang = sel.getAttribute('data-lang') || 'en';
    var copy = {
      en: {
        small:'This usually fits a focused 30-minute Executive Headshot: one strong portrait for LinkedIn, press or a website profile.',
        medium:'This usually fits an Executive Portrait session with calmer preparation, guided image selection and more strategic use.',
        large:'This can support Personal Branding or a broader portrait set for website, media and public communication.',
        xlarge:'This range is suitable for team, event or corporate visual systems, depending on scope and usage rights.',
        custom:'For larger or mixed projects, a personal quote is the right way to define scope, licensing and delivery rhythm.',
        unsure:'If the budget is not clear yet, describe the result you need. I will recommend the smallest format that can honestly do the job.'
      },
      hu: {
        small:'Ez jellemzően egy fókuszált, 30 perces Executive Headshot keret: egy erős portré LinkedInre, sajtóhoz vagy weboldalra.',
        medium:'Ebbe általában egy nyugodtabb Executive Portrait folyamat fér bele, előkészítéssel, irányított képkiválasztással és stratégiai felhasználással.',
        large:'Ez már alkalmas personal branding vagy több képből álló portrésorozat tervezésére weboldalra, médiára és nyilvános kommunikációra.',
        xlarge:'Ez a tartomány csapat-, rendezvény- vagy vállalati vizuális rendszerhez illik, a terjedelemtől és felhasználási jogoktól függően.',
        custom:'Nagyobb vagy vegyes projektnél személyes ajánlat szükséges, hogy a terjedelem, jogok és átadási ritmus tiszta legyen.',
        unsure:'Ha még nem biztos a keret, írd le az eredményt, amit szeretnél. A legkisebb korrekt formátumot fogom javasolni.'
      },
      de: {
        small:'Das passt meist zu einem fokussierten 30-Minuten Executive Headshot: ein starkes Portrait für LinkedIn, Presse oder Website.',
        medium:'Das passt meist zu einer Executive Portrait Session mit ruhiger Vorbereitung, geführter Auswahl und strategischer Nutzung.',
        large:'Damit lässt sich Personal Branding oder ein breiteres Portrait-Set für Website, Medien und öffentliche Kommunikation planen.',
        xlarge:'Dieser Rahmen eignet sich für Team-, Event- oder Corporate-Visual-Systeme, abhängig von Umfang und Nutzungsrechten.',
        custom:'Für größere oder gemischte Projekte ist ein persönliches Angebot sinnvoll, damit Umfang, Rechte und Lieferung klar sind.',
        unsure:'Wenn das Budget noch offen ist, beschreiben Sie das gewünschte Ergebnis. Ich empfehle das kleinste Format, das die Aufgabe ehrlich erfüllen kann.'
      }
    };
    function update(){
      if(!box) return;
      while(box.firstChild){ box.removeChild(box.firstChild); }
      var strong = document.createElement('strong');
      strong.textContent = (sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : '');
      box.appendChild(strong);
      box.appendChild(document.createElement('br'));
      box.appendChild(document.createTextNode((copy[lang][sel.value] || '')));
    }
    sel.addEventListener('change', update); update();
  });


  // Contact and quote forms — send JSON to Google Apps Script.
  // The Google Apps Script expects JSON in e.postData.contents.
  // no-cors is used for Apps Script compatibility, therefore the browser cannot read the response.
  function readField(form, name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? String(el.value || '').trim() : '';
  }
  function readChecked(form, name) {
    return Array.prototype.slice.call(form.querySelectorAll('[name="' + name + '"]:checked')).map(function (el) { return el.value; });
  }
  function readRadio(form, name) {
    var el = form.querySelector('[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  function normalizeVatId(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  function isEuReverseChargeEligible(vatId, companyName) {
    var prefixes = ['BE','BG','CZ','DK','DE','EE','IE','EL','GR','ES','FR','HR','IT','CY','LV','LT','LU','HU','MT','NL','PL','PT','RO','SI','SK','FI','SE'];
    var raw = normalizeVatId(vatId);
    if (!companyName || raw.length < 4) return false;
    var prefix = raw.slice(0, 2);
    return prefix !== 'AT' && prefixes.indexOf(prefix) !== -1;
  }
  function categoryLabel(category, lang) {
    var map = {
      en: {individual:'Individual portrait', group:'Group portraits', brand:'Brand & visual positioning', art:'Fine art photography'},
      hu: {individual:'Egyéni portré', group:'Csoportos portré', brand:'Brand és vizuális pozicionálás', art:'Művészi fotózás'},
      de: {individual:'Einzelportrait', group:'Gruppenportraits', brand:'Brand & visuelle Positionierung', art:'Fine-Art-Fotografie'}
    };
    return (map[lang] && map[lang][category]) || category;
  }
  function buildQuotePayload(form) {
    var lang = form.getAttribute('data-lang') || document.documentElement.lang || 'en';
    var category = readRadio(form, 'category') || 'individual';
    var companyName = readField(form, 'company');
    var vatId = readField(form, 'vat_id');
    var reverse = isEuReverseChargeEligible(vatId, companyName);
    var addons = readChecked(form, 'addons');
    var payload = {
      language: lang,
      pageUrl: window.location.href,
      formType: 'quote',
      formTitle: 'BANHALMI guided quote request',
      category: categoryLabel(category, lang),
      categoryCode: category,
      packageName: '',
      duration: '',
      peopleCount: '',
      retouchedImages: readField(form, 'retouched_images'),
      retouchMode: '',
      photographerCount: readField(form, 'project_photographers') || readField(form, 'photographers'),
      locationType: readField(form, 'location'),
      locationDetails: readField(form, 'specific_location'),
      preferredDates: readField(form, 'timeframe'),
      preferredTime: readField(form, 'preferred_time'),
      addons: addons.join(', '),
      budget: readField(form, 'budget'),
      netAmount: readField(form, 'estimate_net'),
      vatRate: reverse ? '0%' : '20%',
      vatAmount: readField(form, 'estimate_vat'),
      grossAmount: readField(form, 'estimate_gross'),
      reverseCharge: reverse,
      euVatNumber: normalizeVatId(vatId),
      name: readField(form, 'name'),
      email: readField(form, 'email'),
      phone: readField(form, 'phone'),
      companyName: companyName,
      billingAddress: readField(form, 'billing_address'),
      message: readField(form, 'message'),
      consent: !!form.querySelector('[name="consent"]:checked'),
      sendCopy: !!form.querySelector('[name="send_copy"]:checked'),
      estimateSummary: readField(form, 'estimate_summary'),
      estimateVatMode: readField(form, 'estimate_vat_mode'),
      projectGoals: readChecked(form, 'project_goals').join(', '),
      contactPreference: readField(form, 'contact_preference'),
      amChamMember: !!form.querySelector('[name="amcham_member"]:checked'),
      amChamCountry: readField(form, 'amcham_country')
    };
    if (payload.amChamMember) {
      var selectedRetouches = parseInt(payload.retouchedImages || '0', 10) || 0;
      var extraRetouches = Math.ceil(selectedRetouches * 0.5);
      payload.addons = (payload.addons ? payload.addons + ', ' : '') + 'AmCham Professional Network Benefit: +' + extraRetouches + ' retouched images at no additional cost' + (payload.amChamCountry ? ' (' + payload.amChamCountry + ')' : '');
      payload.message = (payload.message || '') + '\n\nAmCham member: yes' + (payload.amChamCountry ? ' — ' + payload.amChamCountry : '') + '\nProfessional Network Benefit: 50% more retouched images than selected.';
    }
    if (payload.projectGoals) { payload.message = (payload.message || '') + '\n\nProject goals: ' + payload.projectGoals; }
    if (payload.contactPreference) { payload.message = (payload.message || '') + '\nPreferred coordination: ' + payload.contactPreference; }
    if (category === 'individual') {
      payload.packageName = readRadio(form, 'individual_mode');
      payload.duration = payload.packageName === 'quick30' ? '30 minutes' : (payload.packageName === 'guided120' ? '2 hours' : '1 hour');
      payload.retouchMode = 'selected retouched images';
    } else if (category === 'group') {
      payload.peopleCount = readField(form, 'people_count');
      payload.photographerCount = readField(form, 'photographers');
      payload.retouchMode = readRadio(form, 'group_delivery') === 'instant' ? 'immediate retouching / max 6 people' : 'later retouching / originals delivered immediately / 48h retouching';
      payload.packageName = 'group-' + (readRadio(form, 'group_delivery') || 'later');
      payload.duration = 'from 1 hour, depending on team size';
    } else if (category === 'brand') {
      payload.packageName = readRadio(form, 'brand_duration');
      payload.duration = ({brand60:'1 hour', brand120:'2 hours', brand180:'3 hours', brand240:'4 hours'})[payload.packageName] || '';
      payload.retouchMode = 'immediate selection, retouching per selected image';
    } else if (category === 'art') {
      payload.packageName = readRadio(form, 'art_type');
      payload.duration = readField(form, 'art_duration').replace('art', '') + ' minutes/or selected block';
      payload.retouchMode = 'fine art retouching per selected image';
    }
    return payload;
  }
  function buildGenericPayload(form) {
    var data = new FormData(form);
    var payload = { language: form.getAttribute('data-lang') || document.documentElement.lang || 'en', pageUrl: window.location.href, formType: form.getAttribute('data-form-kind') || 'contact', formTitle: form.getAttribute('data-form-title') || 'BANHALMI contact form', category: form.getAttribute('data-form-kind') === 'contact' ? 'Contact' : '' };
    data.forEach(function (value, key) {
      if (key === 'website') return;
      payload[key] = value;
    });
    payload.consent = !!form.querySelector('[name="consent"]:checked');
    var extra = [];
    ['budget','timeframe','specific_location','contact_preference','amcham_country'].forEach(function(k){ if(payload[k]) extra.push(k + ': ' + payload[k]); });
    if (form.querySelector('[name="amcham_member"]:checked')) extra.push('AmCham member: yes; Professional Network Benefit may apply.');
    if (extra.length) payload.message = (payload.message || '') + '\n\nAdditional contact context:\n' + extra.join('\n');
    return payload;
  }
  document.querySelectorAll("[data-contact-form]").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (form.elements.website && form.elements.website.value) { return; }
      var isQuote = form.getAttribute('data-form-kind') === 'quote' || (form.elements.form_type && form.elements.form_type.value === 'quote');
      var payload = isQuote ? buildQuotePayload(form) : buildGenericPayload(form);
      payload.pageUrl = window.location.href;
      payload.submittedAt = new Date().toISOString();
      payload.userAgent = navigator.userAgent;
      var endpoint = form.getAttribute("data-endpoint") || (isQuote ? window.BANHALMI_QUOTE_ENDPOINT : window.BANHALMI_CONTACT_ENDPOINT) || window.BANHALMI_FORM_ENDPOINT || "";
      var note = form.querySelector("[data-form-note]");
      var submit = form.querySelector('[type="submit"]');
      function showNote() {
        if (submit) { submit.disabled = false; submit.removeAttribute('aria-busy'); }
        if (note) {
          note.hidden = false;
          note.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        }
      }
      function fallbackMailto() {
        if (submit) { submit.disabled = false; submit.removeAttribute('aria-busy'); }
        var subject = encodeURIComponent((isQuote ? 'BANHALMI quote request — ' : 'BANHALMI enquiry — ') + (payload.category || payload.subject || payload.service || 'photography'));
        var body = encodeURIComponent(Object.keys(payload).map(function (key) { return key + ': ' + payload[key]; }).join("\n"));
        window.location.href = "mailto:hello@norbertbanhalmi.com?subject=" + subject + "&body=" + body;
        showNote();
      }
      if (submit) { submit.disabled = true; submit.setAttribute('aria-busy', 'true'); }
      if (endpoint) {
        try {
          var blob = new Blob([JSON.stringify(payload)], { type: 'text/plain;charset=utf-8' });
          if (navigator.sendBeacon && navigator.sendBeacon(endpoint, blob)) {
            window.setTimeout(showNote, 500);
            form.reset();
            return;
          }
        } catch (e) {}
        fetch(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          mode: "no-cors",
          keepalive: true
        }).then(function(){ showNote(); form.reset(); }).catch(fallbackMailto);
      } else {
        fallbackMailto();
      }
    });
  });

  // ---------- Portfolio gallery: lazy-load, filter, lightbox ----------
  var grid = document.querySelector("[data-gallery]");
  if (grid) {
    // Lazy-load images via data-src
    var imgs = grid.querySelectorAll("img[data-src]");
    function load(img) {
      if (img.dataset.avif && document.createElement('canvas').toDataURL('image/avif').indexOf('data:image/avif') === 0) {
        img.src = img.dataset.avif;
      } else {
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        img.src = img.dataset.src;
      }
      img.addEventListener("load", function () { img.classList.add("loaded"); });
      img.removeAttribute("data-src");
    }
    if ("IntersectionObserver" in window) {
      var lio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { load(e.target); lio.unobserve(e.target); } });
      }, { rootMargin: "300px 0px" });
      imgs.forEach(function (im) { lio.observe(im); });
    } else {
      imgs.forEach(load);
    }

    // Category filter
    var filters = document.querySelectorAll("[data-filter]");
    var sections = document.querySelectorAll("[data-cat-section]");
    filters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-filter");
        filters.forEach(function (b) { b.setAttribute("aria-pressed", b === btn); });
        sections.forEach(function (s) {
          var show = (cat === "all" || s.getAttribute("data-cat-section") === cat);
          s.classList.toggle("pf-hidden", !show);
        });
      });
    });

    // Lightbox
    var lb = document.querySelector("[data-lightbox]");
    if (lb) {
      var lbImg = lb.querySelector("img");
      var lbCap = lb.querySelector(".lb-cap");
      var items = [];
      var current = 0;
      function refreshItems() {
        items = Array.prototype.slice.call(grid.querySelectorAll(".pf-item:not(.pf-hidden) [data-large]"));
      }
      function show(i) {
        refreshItems();
        if (!items.length) return;
        current = (i + items.length) % items.length;
        var el = items[current];
        lbImg.src = el.getAttribute("data-large");
        lbCap.textContent = el.getAttribute("data-cap") || "";
        lb.classList.add("open");
        document.body.style.overflow = "hidden";
      }
      function close() { lb.classList.remove("open"); document.body.style.overflow = ""; lbImg.src = ""; }
      grid.addEventListener("click", function (ev) {
        var t = ev.target.closest("[data-large]");
        if (!t) return;
        refreshItems();
        show(items.indexOf(t));
      });
      lb.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
      lb.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
      lb.querySelector(".lb-close").addEventListener("click", close);
      lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
      document.addEventListener("keydown", function (e) {
        if (!lb.classList.contains("open")) return;
        if (e.key === "Escape") close();
        else if (e.key === "ArrowRight") show(current + 1);
        else if (e.key === "ArrowLeft") show(current - 1);
      });
    }
  }
})();
