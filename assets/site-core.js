export function resolveContactAction(action) {
  const enabled = Boolean(action?.enabled && action?.url?.trim());
  return {
    href: enabled ? action.url.trim() : null,
    disabled: !enabled,
    label: enabled ? action.label : `${action.label} — sắp cập nhật`
  };
}

export function nextExpandedState(current) {
  return !Boolean(current);
}
