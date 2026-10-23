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

const CASE_STUDIES_DATA = {
  'case-team-agents': {
    tabLabel: '01 · Đội ngũ 10+ Agent Mybis',
    tag: 'FLAGSHIP CASE STUDY · HỆ ĐIỀU HÀNH MYBIS AI VER 4.0',
    title: 'Hệ thống Đội ngũ 10+ Nhân sự AI (Javis OS) & Đào tạo AI Doanh nghiệp',
    subtitle: 'Thay thế các quy trình thủ công rời rạc bằng hệ điều hành hơn 10+ AI Agent chuyên trách tự làm việc 24/7 kết hợp bộ nhớ Second Brain 540+ Facts.',
    kpis: [
      { value: '10+ AI Agent', label: 'Chuyên trách chạy song song 24/7' },
      { value: '540+ Facts', label: 'Bộ nhớ nghiệp vụ Second Brain' },
      { value: '18+ Skills', label: 'Đấu nối Zalo · Tele · Fanpage · Ads' },
      { value: '75% – 85%', label: 'Tiết kiệm thời gian vận hành lặp lại' }
    ],
    problem: 'Doanh nghiệp dùng ChatGPT rời rạc chỉ dừng ở hỏi đáp bị động; nhân sự tốn hàng giờ copy-paste, không tự kết nối được với Zalo/Fanpage/CRM/Meta Ads và không tích lũy được tri thức nội bộ chung.',
    solution: [
      'Thiết lập Đội ngũ 10+ AI Agent chuyên trách trong Mybis (Javis Core, Mỹ Linh, Chiến lược gia Marketing, Chuyên gia SEO, Phúc An Digital, Trợ lý Sếp Nam, Chánh văn phòng) bật chế độ Auto 24/7.',
      'Xây dựng kiến trúc Bộ nhớ Doanh nghiệp Second Brain 3 lớp lưu trữ 540+ quy trình SOP, kịch bản chốt sale, bảng giá và lịch sử hội thoại.',
      'Đấu nối trực tiếp đa kênh (Telegram, Zalo, Lark Suite, Facebook Fanpage, Pancake, Google Sheets) kèm phân quyền an toàn 4 cấp độ (Suggest → Read Docs → Auto → Full).',
      'Trực tiếp huấn luyện & chuyển giao quy trình ứng dụng AI thực chiến cho các tập đoàn và doanh nghiệp lớn (EVN, EVNHANOI, Elite PR School).'
    ],
    result: 'Hệ thống vận hành tự động 24/7 với cơ chế tự phục hồi (Self-Healing Keepalive), giúp ban lãnh đạo điều phối toàn bộ dàn nhân sự AI ngay trên Zalo/Telegram bằng tiếng Việt tự nhiên.',
    images: [
      {
        src: 'assets/projects/mybis_team_agents.png',
        caption: 'Giao diện Đội ngũ 10+ Nhân sự AI trong Mybis (Javis OS): Javis Core, Mỹ Linh, Chiến lược gia Marketing, Chuyên gia SEO, Phúc An Digital, Trợ lý Sếp Nam, Chánh văn phòng đang bật Auto 24/7'
      },
      {
        src: 'assets/projects/mybis_second_brain.png',
        caption: 'Kiến trúc Bộ não Doanh nghiệp Second Brain (542 Facts · 33 Agents · 18 Skills · 6 Workflows) tự động kích hoạt Skill biên tập & dựng Video 9:16'
      },
      {
        src: 'assets/projects/mybis_multichannel.png',
        caption: 'Cổng đấu nối đa kênh (Telegram · Zalo · Lark · Discord · Slack · WhatsApp) trực 24/7 phục vụ điều hành doanh nghiệp'
      },
      {
        src: 'assets/projects/mybis_evn_1.jpg',
        caption: 'Kết hợp triển khai Hệ thống Nhân sự AI Mybis 24/7 & Đào tạo AI thực chiến tại EVN, EVNHANOI, Elite PR School'
      }
    ]
  },
  'case-fanpage': {
    tabLabel: '02 · Auto-Media Đa Fanpage',
    tag: 'CASE STUDY 01 · AUTO-MEDIA & CONTENT FACTORY 24/7',
    title: 'Hệ thống AI Agent Tự động Xây kênh & Quản trị Tổ hợp 3 Chuyên trang Fanpage',
    subtitle: 'Vận hành đồng thời Phúc An Digital (tick xanh 134K follow), MYB TV Việt Kiều và MYB TV Công nghệ & Kinh doanh với sản lượng 20–30 bài chất lượng cao mỗi ngày.',
    kpis: [
      { value: '250.000+ Views', label: 'Organic Views trên 50 thước phim Reels' },
      { value: '134K Follow', label: 'Fanpage Phúc An Digital tick xanh' },
      { value: '3 Chuyên trang', label: 'Vận hành đồng thời không tăng nhân sự' },
      { value: '20–30 bài/ngày', label: 'Tự săn tin, xử lý ảnh/video & đăng bài' }
    ],
    problem: 'Cần vận hành đồng thời nhiều Fanpage với tệp độc giả hoàn toàn khác nhau (Đời sống giao thông trong nước, Cộng đồng người Việt tại Hàn - Nhật - Đài, và Chủ doanh nghiệp SME/B2B), yêu cầu 20–30 bài/ngày nhưng thiếu nhân sự biên tập liên tục.',
    solution: [
      'Radar săn tin đa nguồn thời gian thực kết hợp Grok Live X & Web Trend Radar bắt xu hướng trong và ngoài nước.',
      'Biên tập chống văn mẫu AI (Anti-Slop 3 lớp) bằng động cơ kép Gemini/Claude + xAI Grok-4.7, trình bày chuẩn siêu Fanpage.',
      'Hậu kỳ Media tự động bằng Computer Vision & FFmpeg: tự cắt bỏ sạch watermark/banner nguồn, đóng khung thương hiệu 1080x1920 & 1200x1200, in Text Hook cân dòng tiếng Việt và tự vẽ ảnh minh họa bằng Grok Imagine 2.0.',
      'Vòng lặp Closed-Loop Optimization tự đọc Meta Graph API mỗi 6 giờ để tối ưu công thức viết Hook và khung giờ vàng.'
    ],
    result: 'Vận hành tự động 24/7, đạt gần 250.000 views tự nhiên / 50 Reels, nhân bản quy mô quản trị từ 1 trang lên 3 chuyên trang chủ lực mà không cần tăng thêm nhân sự biên tập.',
    images: [
      {
        src: 'assets/projects/case_01_fanpage_factory.png',
        caption: 'Dẫn chứng thực tế 01: Fanpage Phúc An Digital tick xanh (134K Follow) tự động đăng bài gắn khung, MYB TV tự vẽ ảnh Grok 2.0 và AI báo cáo sản lượng qua Telegram'
      },
      {
        src: 'assets/projects/mybis_team_agents.png',
        caption: 'Nhân sự AI "Phúc An Digital" trong Mybis OS tự động báo cáo tiến độ săn tin, viết bài và lên lịch 4 khung giờ vàng'
      }
    ]
  },
  'case-seeding': {
    tabLabel: '03 · Seeding & Top Comment',
    tag: 'CASE STUDY 02 · AUTO-SEEDING & TOP COMMENT HIJACKING',
    title: 'Chiến dịch Auto-Seeding Thảo luận 2 Chiều & Đẩy Top Comment trên 37 Siêu Fanpage',
    subtitle: 'Tự động mồi lửa tương tác 2 chiều trên Page nhà và tuần tra 37 siêu Fanpage/Group lớn nhất Việt Nam mỗi 90 phút để kéo phễu tự nhiên miễn phí.',
    kpis: [
      { value: '37 Siêu Page', label: 'VTV24, Beatvn, CafeF, VnExpress, OFFB...' },
      { value: '90 phút/vòng', label: 'Chu kỳ tuần tra bắt bài viết xu hướng' },
      { value: '9–10 Profile', label: 'Vệ tinh Avatar người Việt thật đẩy Top 1' },
      { value: '0đ Chi phí Ads', label: 'Kéo phễu hiển thị tự nhiên an toàn' }
    ],
    problem: 'Chi phí quảng cáo ngày càng đắt đỏ, bài đăng mới trên Fanpage dễ bị "chết tương tác" giai đoạn đầu và cần kéo luồng độc giả tự nhiên từ các cộng đồng triệu view về trang đích.',
    solution: [
      'Auto-Seeding Thảo luận 2 chiều nội bộ: Dàn Page vệ tinh tự động vào bình luận mở màn tranh luận ngay khi bài mới đăng; Page chính tick xanh tự động Admin Reply nhân đôi chỉ số bình luận.',
      'Top Comment Hijacking trên 37 Fanpage/Group lớn: AI tuần tra mỗi 90 phút, để lại bình luận thông minh/hóm hỉnh bám sát nội dung bài viết (giới hạn an toàn tối đa 1 bình luận/trang đích/ngày).',
      'Điều động biệt đội 9–10 Profile vệ tinh cá nhân (100% avatar chân dung người Việt thật) tự động thả Like và Reply nối tiếp đẩy bình luận của Page chính lên thẳng Top 1.'
    ],
    result: 'Tự động phủ sóng thương hiệu mỗi 90 phút trên các bài viết triệu view hoàn toàn miễn phí, nhân đôi tương tác tự nhiên và kéo phễu người theo dõi thật về Fanpage chính.',
    images: [
      {
        src: 'assets/projects/case_03_auto_seeding.png',
        caption: 'Dẫn chứng thực tế 03: Thảo luận 2 chiều giữa Page vệ tinh & Admin Reply của Phúc An Digital tick xanh, kèm dàn 9 Profile vệ tinh cá nhân đẩy Top 1 bình luận'
      }
    ]
  },
  'case-sale-cskh': {
    tabLabel: '04 · AI Trực Page & Báo Zalo',
    tag: 'CASE STUDY 03 · AI SALE & CSKH ĐA KÊNH 24/7',
    title: 'Hệ thống AI Agent Trực Fanpage, Tư vấn Mẫu HD & Điều phối Chốt đơn trong 3 giây',
    subtitle: 'Huấn luyện sâu từ 1.450+ hội thoại thực tế đa quốc gia (Việt Nam, Mỹ, Canada, Hàn, Nhật, Đài) trên Pancake, Messenger và Zalo.',
    kpis: [
      { value: '1.450+ Hội thoại', label: 'Dữ liệu huấn luyện thực tế đa thị trường' },
      { value: '100% Tức thì', label: 'Tỷ lệ phản hồi khách mới 24/7' },
      { value: '< 3 Giây', label: 'Trích xuất SĐT & tag Sale trên nhóm Zalo' },
      { value: '0% Dẫm chân', label: 'Tự rút lui ngay khi nhân sự thật vào chat' }
    ],
    problem: 'Các chiến dịch quảng cáo đổ lượng tin nhắn lớn vào nhiều khung giờ (kể cả đêm khuya và lệch múi giờ Mỹ - Canada), nhân sự trực page dễ quá tải, phản hồi chậm làm rớt đơn hoặc chatbot cũ trả lời máy móc.',
    solution: [
      'Học sâu từ 1.450+ tin nhắn lịch sử thực tế để nắm vững văn phong tư vấn tự nhiên, danh mục sản phẩm và bảng giá.',
      'AI tự động đón khách mới từ quảng cáo Facebook, gửi bộ ảnh mẫu sản phẩm HD thực tế và khai thác nhu cầu ban đầu.',
      'Cơ chế Phối hợp Người - AI chống dẫm chân tuyệt đối: khi khách hỏi giá chi tiết, gửi SĐT hoặc có nhân sự thật nhảy vào hộp thư, AI lập tức rút lui 100%.',
      'Tự động trích xuất số điện thoại (Lead) và dùng tài khoản trợ lý tag đích danh nhân viên sale trong nhóm Zalo nội bộ chưa đầy 3 giây để chốt đơn nóng.'
    ],
    result: 'Phản hồi khách hàng mới đạt 100% tức thì 24/7, giữ nhiệt khách hàng từ quảng cáo và phối hợp mượt mà với đội ngũ Sale trên Zalo mà không bao giờ nói chồng chéo.',
    images: [
      {
        src: 'assets/projects/case_02_sale_cskh.png',
        caption: 'Dẫn chứng thực tế 02: AI trực Inbox Messenger 24/7 (Linh Florist), tự gửi bộ ảnh mẫu HD cho khách Ads và bàn giao Lead sang nhóm Zalo nội bộ'
      },
      {
        src: 'assets/projects/case_05_vietqr_bills.png',
        caption: 'Dẫn chứng thực tế ca đêm: Bot AI tự động báo cọc, gửi mã VietQR và nhận diện 8 bill chuyển khoản ngân hàng thực tế'
      }
    ]
  },
  'case-vietqr-bills': {
    tabLabel: '05 · Chốt Cọc VietQR Ca Đêm',
    tag: 'CASE STUDY 04 · BẰNG CHỨNG BILL CHUYỂN KHOẢN CA ĐÊM',
    title: 'Bằng chứng Bot AI Tự động Báo cọc, Gửi mã VietQR & Nhận Bill Chuyển khoản 24/7',
    subtitle: 'Trích xuất trực tiếp từ ca trực tự động 00:45 – 09:00 sáng trên Fanpage Linh Florist: khách tự chuyển khoản đặt cọc xuyên đêm không cần nhân sự trực.',
    kpis: [
      { value: '14 Khách cọc', label: 'Chốt cọc thành công chỉ trong 1 ca đêm' },
      { value: '82.4% Tỷ lệ', label: 'Tỷ lệ chuyển đổi khách chốt cọc ca đêm' },
      { value: '5.866.000đ', label: 'Doanh số tự động ca đêm (00:45 – 09:00)' },
      { value: '100% Tự động', label: 'Gửi VietQR, đọc Bill & lên đơn Web quản trị' }
    ],
    problem: 'Khách hàng mua lẻ/đặt hoa thường nhắn tin chốt đơn vào khung giờ khuya (00:00 – 06:00 sáng) khi nhân viên đã ngủ, dẫn đến mất đơn hàng vào tay đối thủ.',
    solution: [
      'AI Agent trực xuyên đêm tư vấn mẫu, chốt thông tin người nhận và tự động tạo/gửi mã VietQR đặt cọc ngay trong Messenger.',
      'Sử dụng thị giác máy tính (Vision AI) đọc và đối soát ảnh chụp màn hình Bill chuyển khoản từ mọi ngân hàng (TPBank, MBBank, VietinBank, LPBank, BIDV, Techcombank, Agribank).',
      'Xác nhận "Dạ em nhận được rồi ạ" tức thì với khách và tự động đẩy đơn hàng đã cọc lên Web Quản trị Đơn (`mybis.mybmedia.vn`) để sáng hôm sau tiệm chỉ việc làm hàng và giao.'
    ],
    result: 'Riêng ca trực tự động từ 00:45 đến 09:00 sáng ngày 20/10/2026 đã chốt cọc thành công 14 khách hàng (tỷ lệ 82.4%), mang về 5.866.000đ doanh số hoàn toàn tự động khi nhân sự đang ngủ.',
    images: [
      {
        src: 'assets/projects/case_05_vietqr_bills.png',
        caption: 'Bằng chứng thực tế: Chat Messenger chốt cọc lúc 00:57 đêm, Web quản trị tự động lên đơn và 8 Bill chuyển khoản ngân hàng thực tế từ 00:55 đến 08:47 sáng'
      },
      {
        src: 'assets/projects/case_02_sale_cskh.png',
        caption: 'Quy trình AI đón khách, gửi mẫu HD và phối hợp nhóm Zalo nội bộ'
      }
    ]
  },
  'case-executive-ads': {
    tabLabel: '06 · Trợ lý CEO & Ads Watchdog',
    tag: 'CASE STUDY 05 · EXECUTIVE AI & META ADS WATCHDOG',
    title: 'Trợ lý AI Điều hành Ban Lãnh đạo & Giám sát Cảnh báo Quảng cáo Tự động',
    subtitle: 'Tham gia trực tiếp vào nhóm điều hành Zalo/Telegram của CEO để nhận chỉ đạo, cập nhật kịch bản hệ thống, cảnh báo số dư TKQC và báo cáo KPI 21:30.',
    kpis: [
      { value: 'Real-time', label: 'Đồng bộ Spend, Mess, Cmt, CPR từ Meta Ads' },
      { value: '21:30 Mỗi tối', label: 'Tự động tổng hợp & gửi báo cáo KPI nhóm' },
      { value: '5 Phút', label: 'Nhắc việc khẩn cấp khi tag Sếp chưa phản hồi' },
      { value: 'Động cơ Kép', label: 'Gemini/Claude + xAI Grok-4.7 vận hành 24/7' }
    ],
    problem: 'Ban lãnh đạo phải chờ nhân sự tổng hợp báo cáo quảng cáo thủ công mỗi ngày, phát hiện muộn khi tài khoản quảng cáo sắp hết tiền/vượt ngưỡng CPR hoặc trôi mất chỉ đạo quan trọng trong nhóm chat.',
    solution: [
      'Đồng bộ trực tiếp Meta Ads & Cloudflare Hub: tự động quét chi tiêu (Spend), Mess, Cmt, đơn hàng và điền vào Google Sheets mỗi sáng.',
      'Watchdog cảnh báo rủi ro TKQC ngay trên Zalo (nhắc chính xác mã tài khoản `act_...`, số dư hiện tại và ngưỡng an toàn).',
      'Trợ lý AI tiếp nhận chỉ đạo bằng tiếng Việt tự nhiên của lãnh đạo trong nhóm Zalo/Telegram để tự cập nhật kịch bản tư vấn cho toàn hệ thống ngay lập tức.',
      'Chủ động trình phương án vận hành và gửi Báo cáo kiểm điểm sản lượng + KPI tự động lúc 21:30 mỗi tối.'
    ],
    result: 'Ban lãnh đạo nắm toàn quyền điều khiển hệ thống AI và theo dõi sức khỏe tài khoản quảng cáo theo thời gian thực ngay trên điện thoại Zalo/Telegram.',
    images: [
      {
        src: 'assets/projects/case_04_executive_ads.png',
        caption: 'Dẫn chứng thực tế 04: Trợ lý AI nhận lệnh cập nhật kịch bản & cảnh báo ngưỡng TKQC trên Zalo, báo cáo KPI 21:30 và sơ đồ MYBIS AI VER 4.0'
      }
    ]
  },
  'case-video-studio': {
    tabLabel: '07 · Studio Video AI Triệu View',
    tag: 'CASE STUDY 06 · AI CREATIVE STUDIO (BÌNH QUÂN · EBISU KAZE)',
    title: 'Studio Sản xuất Video AI Đa cảnh Triệu View & Tự động hóa Nội dung Đa kênh',
    subtitle: 'Ứng dụng Google Flow Veo 3.1, khóa đồng nhất nhân vật (Character Lock), khóa giọng đọc (Voice Lock) và phụ đề Kinetic 1080x1920.',
    kpis: [
      { value: '1.000.000+ View', label: 'Hàng loạt video AI đạt trên 1 triệu lượt xem' },
      { value: '15 Kênh', label: 'Hệ thống kênh nội dung Video AI vận hành đồng bộ' },
      { value: '6.000+ KH/tháng', label: 'Lượng khách hàng thu hút từ hệ thống Video AI' },
      { value: '30+ Nhân sự', label: 'Tối ưu quy trình sản xuất tại Ebisu Kaze Japan' }
    ],
    problem: 'Doanh nghiệp cần sản xuất số lượng lớn video ngắn (Reels/TikTok/Shorts) mỗi ngày để phủ kênh và bán hàng nhưng quay dựng truyền thống tốn kém chi phí ekip và thời gian hậu kỳ.',
    solution: [
      'Tự động hóa từ khâu nghiên cứu chủ đề, viết kịch bản phân cảnh đến tạo video AI đa cảnh bằng Google Flow Veo 3.1 & Kinetic Video.',
      'Khóa đồng nhất nhân vật đại diện (Character Lock) và giọng đọc thương hiệu (Voice Lock / Vbee AIVoice) xuyên suốt toàn bộ chuỗi video.',
      'Tự động render video dọc 1080x1920 có phụ đề động Kinetic Typography và chuyển đổi dữ liệu sang Slide .pptx, Poster hoặc Landing Page Webcake .pke.'
    ],
    result: 'Xây dựng thành công 15 kênh nội dung với nhiều video cán mốc 1 triệu+ lượt xem, mang về hơn 6.000+ khách hàng/tháng cho Bình Quân và tối ưu hiệu suất cho hơn 30 nhân sự tại Ebisu Kaze Japan.',
    images: [
      {
        src: 'assets/projects/binhquan_1.jpg',
        caption: 'Hệ thống 15 kênh sản xuất Video AI triệu view thu hút 6.000+ khách hàng/tháng'
      },
      {
        src: 'assets/projects/mybis_evn_1.jpg',
        caption: 'Đào tạo & chuyển giao quy trình sản xuất nội dung và Video AI thực chiến cho doanh nghiệp'
      }
    ]
  }
};

function setupCaseStudyModal() {
  const modal = document.querySelector('[data-case-modal]');
  if (!modal) return;

  const tabsContainer = modal.querySelector('[data-case-tabs]');
  const closeBtn = modal.querySelector('[data-case-close]');
  const mainImg = modal.querySelector('[data-case-main-img]');
  const imgCaption = modal.querySelector('[data-case-img-caption]');
  const thumbsContainer = modal.querySelector('[data-case-thumbs]');
  const tagEl = modal.querySelector('[data-case-tag]');
  const titleEl = modal.querySelector('[data-case-title]');
  const subtitleEl = modal.querySelector('[data-case-subtitle]');
  const kpisEl = modal.querySelector('[data-case-kpis]');
  const problemEl = modal.querySelector('[data-case-problem]');
  const solutionEl = modal.querySelector('[data-case-solution]');
  const resultEl = modal.querySelector('[data-case-result]');
  const bookBtn = modal.querySelector('[data-case-book-btn]');
  const stageEl = modal.querySelector('[data-case-stage]');

  let currentCaseKey = 'case-team-agents';
  let currentImgIdx = 0;

  const renderTabs = () => {
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';
    for (const [key, item] of Object.entries(CASE_STUDIES_DATA)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `case-tab-btn${key === currentCaseKey ? ' is-active' : ''}`;
      btn.textContent = item.tabLabel;
      btn.addEventListener('click', () => selectCase(key));
      tabsContainer.appendChild(btn);
    }
  };

  const renderImage = (idx) => {
    const item = CASE_STUDIES_DATA[currentCaseKey];
    if (!item || !item.images.length) return;
    currentImgIdx = idx;
    const imgObj = item.images[idx] || item.images[0];
    if (mainImg) {
      mainImg.src = imgObj.src;
      mainImg.alt = imgObj.caption;
    }
    if (imgCaption) {
      imgCaption.textContent = imgObj.caption;
    }
    if (thumbsContainer) {
      thumbsContainer.hidden = item.images.length <= 1;
      thumbsContainer.innerHTML = '';
      if (item.images.length > 1) {
        item.images.forEach((im, i) => {
          const tBtn = document.createElement('button');
          tBtn.type = 'button';
          tBtn.className = `case-thumb-btn${i === idx ? ' is-active' : ''}`;
          tBtn.innerHTML = `<img src="${im.src}" alt="" loading="lazy"><span>Ảnh 0${i + 1}</span>`;
          tBtn.addEventListener('click', () => renderImage(i));
          thumbsContainer.appendChild(tBtn);
        });
      }
    }
  };

  const selectCase = (caseKey) => {
    if (!CASE_STUDIES_DATA[caseKey]) return;
    currentCaseKey = caseKey;
    const item = CASE_STUDIES_DATA[caseKey];
    renderTabs();
    renderImage(0);

    if (tagEl) tagEl.textContent = item.tag;
    if (titleEl) titleEl.textContent = item.title;
    if (subtitleEl) subtitleEl.textContent = item.subtitle;
    if (problemEl) problemEl.textContent = item.problem;
    if (resultEl) resultEl.textContent = item.result;

    if (kpisEl) {
      kpisEl.innerHTML = item.kpis
        .map((k) => `<div class="case-kpi-card"><strong>${k.value}</strong><span>${k.label}</span></div>`)
        .join('');
    }
    if (solutionEl) {
      solutionEl.innerHTML = item.solution.map((s) => `<li>${s}</li>`).join('');
    }
  };

  const openCaseModal = (caseKey) => {
    selectCase(caseKey || 'case-team-agents');
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeCaseModal = () => {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (stageEl) stageEl.classList.remove('is-zoomed');
  };

  if (stageEl) {
    stageEl.addEventListener('click', () => {
      stageEl.classList.toggle('is-zoomed');
    });
  }

  for (const trigger of document.querySelectorAll('[data-open-case]')) {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openCaseModal(trigger.dataset.openCase);
    });
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCaseModal(trigger.dataset.openCase);
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeCaseModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeCaseModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeCaseModal();
  });

  if (bookBtn) {
    bookBtn.addEventListener('click', () => {
      closeCaseModal();
      const bookingTrigger = document.querySelector('[data-contact="booking"]');
      if (bookingTrigger) bookingTrigger.click();
    });
  }
}

hydrateContactActions();
setupBookingCalendar();
setupCaseStudyModal();
setupSystemMap();
setupUseCaseFilter();
setupCardSpotlight();
setupHeroCanvas();
setupFaq();
setupMobileNavigation();
setupScrollSpy();
setupReveal();
setCurrentYear();
