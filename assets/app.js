import { SITE_CONTENT } from './content.js';
import { resolveContactAction, nextExpandedState } from './site-core.js';

document.documentElement.classList.add('js');

const SYSTEM_FLOWS = {
  sales: {
    code: 'CẤP ĐỘ 01 · ỨNG DỤNG AI CƠ BẢN',
    sources: ['crm'],
    text: 'Hướng dẫn đội ngũ sử dụng thành thạo công cụ AI để soạn thảo, tổng hợp thông tin và xử lý việc hàng ngày nhanh gấp nhiều lần.'
  },
  marketing: {
    code: 'CẤP ĐỘ 02 · CHUẨN HÓA NÂNG CAO',
    sources: ['crm', 'docs'],
    text: 'Xây dựng bộ câu lệnh chuẩn, trợ lý tri thức nội bộ và quy trình sản xuất nội dung/video AI cho từng phòng ban.'
  },
  operations: {
    code: 'CẤP ĐỘ 03 · AI AGENT TỰ ĐỘNG 24/7',
    sources: ['crm', 'docs', 'apps'],
    text: 'Triển khai các AI Agent kết nối trực tiếp Zalo, Fanpage, bảng tính để tự động chăm sóc khách hàng, làm báo cáo và nhắc việc 24/7.'
  }
};

function hydrateContactActions() {
  for (const link of document.querySelectorAll('[data-contact]')) {
    const key = link.dataset.contact;
    const resolved = resolveContactAction(SITE_CONTENT.contacts[key]);
    link.textContent = resolved.label;

    if (resolved.disabled) {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('title', 'Thông tin liên hệ đang được cập nhật');
      link.addEventListener('click', (event) => event.preventDefault());
    } else {
      link.href = resolved.href;
      link.removeAttribute('aria-disabled');
      link.removeAttribute('title');
      if (/^https?:\/\//.test(resolved.href)) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    }
  }

  const email = document.querySelector('[data-placeholder="email"]');
  const phone = document.querySelector('[data-placeholder="phone"]');
  const zalo = document.querySelector('[data-placeholder="zalo"]');
  if (email && SITE_CONTENT.contacts.email) email.textContent = SITE_CONTENT.contacts.email;
  if (phone && SITE_CONTENT.contacts.phone) phone.textContent = SITE_CONTENT.contacts.phone;
  if (zalo && SITE_CONTENT.contacts.zalo?.enabled && SITE_CONTENT.contacts.zalo?.url) {
    zalo.textContent = SITE_CONTENT.contacts.zalo.url;
  }
}

function setupSystemMap() {
  const map = document.querySelector('[data-system-map]');
  if (!map) return;

  const triggers = [...map.querySelectorAll('[data-flow-trigger]')];
  const sources = [...map.querySelectorAll('[data-source-node]')];
  const traceCode = map.querySelector('[data-trace-code]');
  const traceText = map.querySelector('[data-trace-text]');

  const activateFlow = (flowKey) => {
    const config = SYSTEM_FLOWS[flowKey];
    if (!config) return;

    triggers.forEach((btn) => {
      const active = btn.dataset.flowTrigger === flowKey;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    sources.forEach((node) => {
      const active = config.sources.includes(node.dataset.sourceNode);
      node.classList.toggle('is-active', active);
    });

    if (traceCode) traceCode.textContent = config.code;
    if (traceText) traceText.textContent = config.text;
  };

  triggers.forEach((btn) => {
    btn.addEventListener('click', () => activateFlow(btn.dataset.flowTrigger));
    btn.addEventListener('mouseenter', () => activateFlow(btn.dataset.flowTrigger));
  });
}

function setupUseCaseFilter() {
  const buttons = [...document.querySelectorAll('[data-usecase-filter]')];
  const cards = [...document.querySelectorAll('[data-usecase-category]')];
  if (!buttons.length || !cards.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.usecaseFilter;
      buttons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });

      cards.forEach((card) => {
        const categories = (card.dataset.usecaseCategory || '').split(/\s+/);
        const matched = filter === 'all' || categories.includes(filter);
        card.classList.toggle('is-dimmed', !matched);
      });
    });
  });
}

function setupCardSpotlight() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  let rafId = 0;
  let lastEvent = null;

  const updateSpotlight = () => {
    rafId = 0;
    if (!lastEvent || !(lastEvent.target instanceof Element)) return;
    const card = lastEvent.target.closest('[data-spotlight]');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${Math.round(lastEvent.clientX - rect.left)}px`);
    card.style.setProperty('--mouse-y', `${Math.round(lastEvent.clientY - rect.top)}px`);
  };

  window.addEventListener('pointermove', (event) => {
    lastEvent = event;
    if (!rafId) {
      rafId = requestAnimationFrame(updateSpotlight);
    }
  }, { passive: true });
}

function setupFaq() {
  for (const button of document.querySelectorAll('.faq-item button[aria-controls]')) {
    button.addEventListener('click', () => {
      const current = button.getAttribute('aria-expanded') === 'true';
      const next = nextExpandedState(current);
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      button.setAttribute('aria-expanded', String(next));
      if (panel) panel.hidden = !next;
    });
  }
}

function setupMobileNavigation() {
  const toggle = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('primary-nav');
  if (!toggle || !navigation) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
    const label = toggle.querySelector('.sr-only');
    if (label) label.textContent = open ? 'Đóng menu' : 'Mở menu';
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  for (const link of navigation.querySelectorAll('a')) {
    link.addEventListener('click', () => setOpen(false));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      toggle.focus();
    }
  });
}

function setupScrollSpy() {
  const header = document.querySelector('[data-header]');
  const navLinks = [...document.querySelectorAll('.primary-nav a[href^="#"]')];

  const onScroll = () => {
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!('IntersectionObserver' in window) || !navLinks.length) return;

  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const spy = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const id = `#${entry.target.id}`;
        navLinks.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === id);
        });
      }
    }
  }, { rootMargin: '-35% 0px -55% 0px' });

  sections.forEach((sec) => spy.observe(sec));
}

function setupReveal() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = [...document.querySelectorAll('[data-reveal]')];
  targets.forEach((target, index) => {
    if (!reduceMotion) {
      const delay = (index % 4) * 35;
      target.style.setProperty('--reveal-delay', `${delay}ms`);
    }
    target.classList.add('is-visible');
  });
}

function setupHeroCanvas() {
  const canvas = document.querySelector('[data-hero-canvas]');
  if (!canvas) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let running = true;
  let lastTime = performance.now();
  const pointer = { x: -9999, y: -9999, active: false };
  const nodes = [];

  const createNodes = () => {
    nodes.length = 0;
    const count = width < 768 ? 16 : 28;
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.42,
        r: 1.5 + (i % 3) * 0.65
      });
    }
  };

  const resize = () => {
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || 680;
    canvas.width = width;
    canvas.height = height;
    createNodes();
  };

  resize();
  window.addEventListener('resize', resize, { passive: true });

  const heroSection = canvas.closest('.hero');
  if (heroSection) {
    heroSection.addEventListener('pointermove', (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY + window.scrollY;
      pointer.active = true;
    }, { passive: true });
    heroSection.addEventListener('pointerleave', () => {
      pointer.active = false;
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      const heroObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const wasRunning = running;
          running = entry.isIntersecting;
          if (running && !wasRunning) {
            lastTime = performance.now();
            requestAnimationFrame(draw);
          }
        }
      }, { threshold: 0.01 });
      heroObserver.observe(heroSection);
    }
  }

  const maxDistSq = 140 * 140;
  const ptrDistSq = 175 * 175;

  const draw = (now) => {
    if (!running) return;
    const dt = Math.min((now - lastTime) / 16.667, 2.5);
    lastTime = now;

    ctx.clearRect(0, 0, width, height);

    // 1. Single batched stroke for node-to-node links
    ctx.beginPath();
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx * dt;
      n.y += n.vy * dt;

      if (n.x < 0) n.x = width;
      else if (n.x > width) n.x = 0;
      if (n.y < 0) n.y = height;
      else if (n.y > height) n.y = 0;

      for (let j = i + 1; j < nodes.length; j++) {
        const m = nodes[j];
        const dx = n.x - m.x;
        const dy = n.y - m.y;
        if (dx * dx + dy * dy < maxDistSq) {
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(m.x, m.y);
        }
      }
    }
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. Single batched stroke for cursor links
    if (pointer.active) {
      ctx.beginPath();
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = pointer.x - n.x;
        const dy = pointer.y - n.y;
        if (dx * dx + dy * dy < ptrDistSq) {
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(pointer.x, pointer.y);
        }
      }
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.28)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 3. Single batched fill for all particles
    ctx.beginPath();
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      ctx.moveTo(n.x + n.r, n.y);
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    }
    ctx.fillStyle = 'rgba(165, 180, 252, 0.68)';
    ctx.fill();

    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
}

function setCurrentYear() {
  const year = new Date().getFullYear();
  document.querySelectorAll('[data-year]').forEach((node) => { node.textContent = String(year); });
}

const CONSULT_SLOTS = [
  { id: '09:00', label: '09:00 – 09:45', period: 'Buổi sáng', startHour: 9, startMin: 0, endHour: 9, endMin: 45 },
  { id: '10:15', label: '10:15 – 11:00', period: 'Buổi sáng', startHour: 10, startMin: 15, endHour: 11, endMin: 0 },
  { id: '14:00', label: '14:00 – 14:45', period: 'Buổi chiều', startHour: 14, startMin: 0, endHour: 14, endMin: 45 },
  { id: '15:30', label: '15:30 – 16:15', period: 'Buổi chiều', startHour: 15, startMin: 30, endHour: 16, endMin: 15 },
  { id: '16:45', label: '16:45 – 17:30', period: 'Buổi chiều', startHour: 16, startMin: 45, endHour: 17, endMin: 30 },
  { id: '20:00', label: '20:00 – 20:45', period: 'Buổi tối', startHour: 20, startMin: 0, endHour: 20, endMin: 45 }
];

const WEEKDAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const STORAGE_BOOKINGS_KEY = 'vincent_ai_booked_slots_v1';

function toDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatVietnameseDate(dateObj) {
  const dayName = WEEKDAY_NAMES[dateObj.getDay()];
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  return `${dayName}, ${d}/${m}/${y}`;
}

function loadUserBookedMap() {
  try {
    const raw = localStorage.getItem(STORAGE_BOOKINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUserBookedSlot(dateKey, slotId) {
  try {
    const map = loadUserBookedMap();
    map[`${dateKey}|${slotId}`] = true;
    localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

function getDaySlotsState(dateObj, now, bookedMap) {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

  if (targetDay < todayStart) {
    return { isPast: true, isSunday: false, slots: [], availableCount: 0 };
  }
  if (targetDay.getDay() === 0) {
    return { isPast: false, isSunday: true, slots: [], availableCount: 0 };
  }

  const dateKey = toDateKey(targetDay);
  const seed = targetDay.getFullYear() * 372 + (targetDay.getMonth() + 1) * 31 + targetDay.getDate();
  const isToday = targetDay.getTime() === todayStart.getTime();

  const slots = CONSULT_SLOTS.map((slot, idx) => {
    const userBooked = Boolean(bookedMap[`${dateKey}|${slot.id}`]);
    // Deterministic realistic schedule: 1-2 slots pre-booked per day
    const preBooked = ((seed + idx * 5) % 4 === 0) || (targetDay.getDay() === 6 && idx >= 4);
    const passedToday = isToday && (now.getHours() > slot.startHour || (now.getHours() === slot.startHour && now.getMinutes() >= slot.startMin));
    const available = !userBooked && !preBooked && !passedToday;
    let statusText = 'Còn trống';
    if (userBooked) statusText = 'Bạn đã đặt';
    else if (passedToday) statusText = 'Đã qua giờ';
    else if (preBooked) statusText = 'Đã kín lịch';

    return {
      ...slot,
      available,
      userBooked,
      statusText
    };
  });

  const availableCount = slots.filter((s) => s.available).length;
  return { isPast: false, isSunday: false, slots, availableCount };
}

function buildGoogleCalendarUrl(dateObj, slot, topic, clientName, clientPhone) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = dateObj.getFullYear();
  const m = pad(dateObj.getMonth() + 1);
  const d = pad(dateObj.getDate());
  const startStr = `${y}${m}${d}T${pad(slot.startHour)}${pad(slot.startMin)}00`;
  const endStr = `${y}${m}${d}T${pad(slot.endHour)}${pad(slot.endMin)}00`;
  const title = encodeURIComponent(`Tư vấn AI 1:1 cùng Lê Đình Phan Anh — ${ clientName }`);
  const details = encodeURIComponent(
    `Buổi tư vấn giải pháp AI & AI Agent 1:1 cùng Lê Đình Phan Anh.\n` +
    `• Nội dung: ${topic}\n` +
    `• Khách hàng: ${clientName} (${clientPhone})\n` +
    `• Zalo liên hệ: https://zalo.me/0372038569 (0372 038 569)`
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&ctz=Asia/Ho_Chi_Minh&details=${details}`;
}

function setupBookingCalendar() {
  const modal = document.querySelector('[data-booking-modal]');
  if (!modal) return;

  const formView = modal.querySelector('[data-booking-form-view]');
  const successView = modal.querySelector('[data-booking-success-view]');
  const monthLabel = modal.querySelector('[data-cal-month-label]');
  const prevBtn = modal.querySelector('[data-cal-prev]');
  const nextBtn = modal.querySelector('[data-cal-next]');
  const daysGrid = modal.querySelector('[data-cal-days]');
  const slotsContainer = modal.querySelector('[data-slots-container]');
  const dateHeading = modal.querySelector('[data-selected-date-heading]');
  const dateSub = modal.querySelector('[data-selected-date-sub]');
  const summaryDate = modal.querySelector('[data-summary-date]');
  const summarySlot = modal.querySelector('[data-summary-slot]');
  const form = modal.querySelector('[data-booking-form]');
  const submitBtn = modal.querySelector('[data-booking-submit]');

  const now = new Date();
  let viewYear = now.getFullYear();
  let viewMonth = now.getMonth();
  let selectedDate = null;
  let selectedSlotId = null;

  const findInitialAvailableDate = () => {
    const bookedMap = loadUserBookedMap();
    for (let offset = 0; offset < 21; offset++) {
      const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      const state = getDaySlotsState(candidate, now, bookedMap);
      if (state.availableCount > 0) {
        return candidate;
      }
    }
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  };

  selectedDate = findInitialAvailableDate();
  viewYear = selectedDate.getFullYear();
  viewMonth = selectedDate.getMonth();

  const updateSummary = () => {
    if (!selectedDate) return;
    if (summaryDate) summaryDate.textContent = formatVietnameseDate(selectedDate);
    const slotObj = CONSULT_SLOTS.find((s) => s.id === selectedSlotId);
    if (summarySlot) {
      summarySlot.textContent = slotObj ? `Khung giờ: ${slotObj.label} (${slotObj.period})` : 'Vui lòng chọn khung giờ trống';
    }
    if (submitBtn) {
      submitBtn.disabled = !slotObj;
    }
  };

  const renderSlots = () => {
    if (!selectedDate || !slotsContainer) return;
    const bookedMap = loadUserBookedMap();
    const state = getDaySlotsState(selectedDate, now, bookedMap);

    if (dateHeading) dateHeading.textContent = formatVietnameseDate(selectedDate);
    if (dateSub) {
      dateSub.textContent = state.availableCount > 0
        ? `Hiện còn ${state.availableCount} khung giờ trống trong ngày`
        : 'Ngày này đã kín lịch, vui lòng chọn ngày khác trên lịch';
    }

    if (!selectedSlotId || !state.slots.some((s) => s.id === selectedSlotId && s.available)) {
      const firstOpen = state.slots.find((s) => s.available);
      selectedSlotId = firstOpen ? firstOpen.id : null;
    }

    slotsContainer.innerHTML = '';
    state.slots.forEach((slot) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot-btn' + (slot.id === selectedSlotId ? ' is-selected' : '');
      btn.disabled = !slot.available;
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', String(slot.id === selectedSlotId));
      btn.innerHTML = `
        <span class="slot-time">${slot.label}</span>
        <span class="slot-tag">${slot.available ? `● Còn trống (${slot.period})` : slot.statusText}</span>
      `;
      btn.addEventListener('click', () => {
        selectedSlotId = slot.id;
        renderSlots();
        updateSummary();
      });
      slotsContainer.appendChild(btn);
    });

    updateSummary();
  };

  const renderCalendar = () => {
    if (!daysGrid || !monthLabel) return;
    monthLabel.textContent = `Tháng ${viewMonth + 1}, ${viewYear}`;

    const isCurrentOrPastMonth = viewYear < now.getFullYear() || (viewYear === now.getFullYear() && viewMonth <= now.getMonth());
    if (prevBtn) prevBtn.disabled = isCurrentOrPastMonth;

    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    // Convert JS Sunday=0..Saturday=6 into Monday=0..Sunday=6
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    const bookedMap = loadUserBookedMap();
    const selectedKey = selectedDate ? toDateKey(selectedDate) : '';
    const todayKey = toDateKey(now);

    daysGrid.innerHTML = '';

    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day-empty';
      daysGrid.appendChild(empty);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(viewYear, viewMonth, day);
      const dateKey = toDateKey(dateObj);
      const state = getDaySlotsState(dateObj, now, bookedMap);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal-day-btn';
      if (dateKey === todayKey) btn.classList.add('is-today');
      if (dateKey === selectedKey) btn.classList.add('is-selected');

      const isDisabled = state.isPast || state.isSunday || state.availableCount === 0;
      btn.disabled = isDisabled;

      let dotClass = 'is-open';
      let metaText = `${state.availableCount} trống`;
      if (state.isPast) {
        dotClass = 'is-full';
        metaText = 'Qua';
      } else if (state.isSunday) {
        dotClass = 'is-full';
        metaText = 'Nghỉ';
      } else if (state.availableCount === 0) {
        dotClass = 'is-full';
        metaText = 'Kín';
      } else if (state.availableCount <= 2) {
        dotClass = 'is-few';
      }

      btn.setAttribute('aria-label', `${formatVietnameseDate(dateObj)} - ${metaText}`);
      btn.innerHTML = `
        <span class="cal-day-num">${day}</span>
        <span class="cal-day-meta"><i class="cal-day-dot ${dotClass}"></i>${metaText}</span>
      `;

      btn.addEventListener('click', () => {
        selectedDate = dateObj;
        selectedSlotId = null;
        renderCalendar();
        renderSlots();
      });

      daysGrid.appendChild(btn);
    }
  };

  const openModal = (event) => {
    if (event) event.preventDefault();
    if (formView) formView.hidden = false;
    if (successView) successView.hidden = true;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-modal-open');
    renderCalendar();
    renderSlots();
  };

  const closeModal = () => {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-modal-open');
  };

  // Attach click handler to all [data-contact="booking"] buttons
  document.querySelectorAll('[data-contact="booking"]').forEach((btn) => {
    btn.addEventListener('click', openModal);
  });

  modal.querySelectorAll('[data-booking-close]').forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeModal();
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      viewMonth -= 1;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear -= 1;
      }
      renderCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      viewMonth += 1;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear += 1;
      }
      renderCalendar();
    });
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!selectedDate || !selectedSlotId) return;

      const slotObj = CONSULT_SLOTS.find((s) => s.id === selectedSlotId);
      if (!slotObj) return;

      const topicInput = modal.querySelector('[data-booking-topic]');
      const nameInput = modal.querySelector('[data-booking-name]');
      const phoneInput = modal.querySelector('[data-booking-phone]');

      const topic = topicInput ? topicInput.value : 'Tư vấn giải pháp AI';
      const clientName = (nameInput?.value || '').trim() || 'Khách hàng Doanh nghiệp';
      const clientPhone = (phoneInput?.value || '').trim() || 'Chưa cung cấp';

      const dateKey = toDateKey(selectedDate);
      saveUserBookedSlot(dateKey, slotObj.id);

      const dateTimeLabel = `${slotObj.label} · ${formatVietnameseDate(selectedDate)}`;
      const ticketDatetime = modal.querySelector('[data-ticket-datetime]');
      const ticketTopic = modal.querySelector('[data-ticket-topic]');
      const ticketClient = modal.querySelector('[data-ticket-client]');

      if (ticketDatetime) ticketDatetime.textContent = dateTimeLabel;
      if (ticketTopic) ticketTopic.textContent = topic;
      if (ticketClient) ticketClient.textContent = `${clientName} (${clientPhone})`;

      const bookingSummaryText =
        `Xin chào Phan Anh, mình muốn xác nhận lịch hẹn tư vấn AI:\n` +
        `- Thời gian: ${dateTimeLabel}\n` +
        `- Nội dung: ${topic}\n` +
        `- Người đặt: ${clientName} (${clientPhone})`;

      const copyNotice = modal.querySelector('[data-booking-copy-notice]');
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(bookingSummaryText);
          if (copyNotice) copyNotice.hidden = false;
        } catch {
          if (copyNotice) copyNotice.hidden = true;
        }
      }

      const zaloBtn = modal.querySelector('[data-ticket-zalo]');
      const gcalBtn = modal.querySelector('[data-ticket-gcal]');
      const mailBtn = modal.querySelector('[data-ticket-mailto]');

      if (zaloBtn) zaloBtn.href = SITE_CONTENT.contacts.booking.url || 'https://zalo.me/0372038569';
      if (gcalBtn) gcalBtn.href = buildGoogleCalendarUrl(selectedDate, slotObj, topic, clientName, clientPhone);
      if (mailBtn) {
        const subject = encodeURIComponent(`[Đặt lịch tư vấn AI] ${dateTimeLabel} — ${clientName}`);
        const body = encodeURIComponent(bookingSummaryText);
        mailBtn.href = `mailto:${SITE_CONTENT.contacts.email}?subject=${subject}&body=${body}`;
      }

      if (formView) formView.hidden = true;
      if (successView) successView.hidden = false;
    });
  }

  const resetBtn = modal.querySelector('[data-booking-reset]');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      selectedSlotId = null;
      if (formView) formView.hidden = false;
      if (successView) successView.hidden = true;
      renderCalendar();
      renderSlots();
    });
  }
}

hydrateContactActions();
setupBookingCalendar();
setupSystemMap();
setupUseCaseFilter();
setupCardSpotlight();
setupHeroCanvas();
setupFaq();
setupMobileNavigation();
setupScrollSpy();
setupReveal();
setCurrentYear();
