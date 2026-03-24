/** Links externos: mesma aba se `openInNewTab: false`; caso contrário, nova aba. */
export function externalAnchorProps(menu) {
  if (!menu.isExternal) return {};
  if (menu.openInNewTab === false) {
    return { rel: 'noopener noreferrer' };
  }
  return { target: '_blank', rel: 'noopener noreferrer' };
}

const menu_data = [
  {
    id: 1,
    title: 'Início',
    link: '/',
  },
  {
    id: 2,
    title: 'Sobre a N-1',
    link: 'https://n-1edicoes.org/sobre-a-n-1/',
    isExternal: true,
    /** Abrir na mesma aba (site institucional) */
    openInNewTab: false,
  },
  {
    id: 3,
    title: 'Leituras',
    link: 'https://n-1edicoes.org/leituras/',
    isExternal: true,
    openInNewTab: false,
  },
  {
    id: 4,
    title: 'Contato',
    link: 'https://n-1edicoes.org/contato/',
    isExternal: true,
    openInNewTab: false,
  },
];

export default menu_data;
