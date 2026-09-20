export function bootstrapApp(): void {
  const root = document.createElement('div');
  root.id = 'app';
  document.body.append(root);

  root.innerHTML = '<span>minigames</span>';
}
