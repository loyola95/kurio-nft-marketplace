import { Link } from '@tanstack/react-router'
import { Icon, type IconName } from '@/components/icon'
import type { CatalogSearch } from '@/features/catalog/searchSchema'
import { Newsletter } from './Newsletter'

const SERVICES = [
  {
    mark: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    mark: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    mark: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

type FooterLink = { label: string } & (
  | { to: '/perfil' | '/perfil/favoritos'; search?: undefined }
  | { to: '/'; search: CatalogSearch }
  | { to: '/indisponivel'; search: { de: string } }
)

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Meu perfil',
    links: [
      { label: 'Meu perfil', to: '/perfil' },
      { label: 'Minha coleção', to: '/indisponivel', search: { de: 'colecao' } },
      { label: 'Atividade', to: '/indisponivel', search: { de: 'atividade' } },
      { label: 'Estúdio do criador', to: '/indisponivel', search: { de: 'estudio' } },
      { label: 'Lista de interesse', to: '/perfil/favoritos' },
    ],
  },
  {
    title: 'Central de ajuda',
    links: [
      { label: 'Central de ajuda', to: '/indisponivel', search: { de: 'ajuda' } },
      { label: 'Como comprar NFTs', to: '/indisponivel', search: { de: 'como-comprar' } },
      { label: 'Carteira e segurança', to: '/indisponivel', search: { de: 'seguranca' } },
      { label: 'Política do mercado', to: '/indisponivel', search: { de: 'politica' } },
      { label: 'Denunciar item', to: '/indisponivel', search: { de: 'denuncia' } },
    ],
  },
  {
    title: 'Coleções',
    links: [
      { label: 'Arte digital', to: '/', search: { categorias: ['arte-digital' as const] } },
      { label: 'Fotografia', to: '/', search: { categorias: ['fotografia' as const] } },
      { label: 'Música', to: '/', search: { categorias: ['musica' as const] } },
      { label: 'Arte 3D', to: '/', search: { categorias: ['arte-3d' as const] } },
      { label: 'Utilidade', to: '/', search: { categorias: ['utilidade' as const] } },
    ],
  },
]

const SOCIAL: { icon: IconName; label: string; href: string }[] = [
  { icon: 'social-facebook', label: 'Facebook', href: 'https://www.facebook.com' },
  { icon: 'social-instagram', label: 'Instagram', href: 'https://www.instagram.com' },
  { icon: 'social-twitter', label: 'X (Twitter)', href: 'https://x.com' },
  { icon: 'social-linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com' },
  { icon: 'social-other', label: 'YouTube', href: 'https://www.youtube.com' },
]

export function Footer() {
  return (
    <footer className="text-foreground">
      <section aria-label="Serviços" className="rounded-t-none bg-surface p-6 lg:p-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,357px)] lg:gap-0">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="flex flex-col gap-3 lg:border-r lg:border-primary lg:px-4"
            >
              <span
                aria-hidden
                className="grid size-[74px] place-items-center rounded-full bg-primary text-2xl leading-8 font-bold text-primary-foreground"
              >
                {s.mark}
              </span>
              <h2 className="text-[17px] leading-4 font-bold">{s.title}</h2>
              <p className="max-w-[204px] text-sm leading-[22px] text-text-2">{s.text}</p>
            </div>
          ))}
          <div className="lg:px-4">
            <Newsletter />
          </div>
        </div>
      </section>

      <div className="bg-surface-3 px-6 py-8 lg:px-8">
        <div className="grid gap-4 text-sm leading-[22px] md:grid-cols-4 md:items-center">
          <Link to="/" className="text-sm font-bold">
            KURIO
          </Link>
          <p>
            Feito para colecionadores,
            <br />
            criadores e cultura
          </p>
          <a href="mailto:contato@email.com" className="hover:text-highlight">
            contato@email.com
          </a>
          <a href="tel:+551140028922" className="hover:text-highlight">
            +55 11 4002 8922
          </a>
        </div>
      </div>

      <div className="bg-surface p-6 lg:p-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-2">
              <h2 className="text-lg leading-4 font-bold">{col.title}</h2>
              <ul className="text-sm leading-[30px]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} search={l.search} className="hover:text-highlight">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <h2 className="text-lg leading-4 font-bold">Redes sociais</h2>
              <ul className="flex gap-2.5">
                {SOCIAL.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${s.label} (abre em nova aba)`}
                      className="grid size-[30px] place-items-center rounded-sm border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <Icon name={s.icon} size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="text-lg leading-4 font-bold">Carteiras compatíveis</h2>
              <p className="rounded-md border border-border-strong bg-surface-3 px-2 py-2 text-[9px] leading-3 font-bold tracking-[0.1px] text-highlight">
                METAMASK • WALLETCONNECT • COINBASE
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="py-1 text-center text-sm leading-[30px]">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
