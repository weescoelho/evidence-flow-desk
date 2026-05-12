# Clean Code Guidelines

Este documento estabelece as regras de clean code para o projeto **Evidence Flow Desk**. Todas as orientações aqui devem ser seguidas por LLMs e desenvolvedores para manter a qualidade e consistência do código.

## Stack do Projeto

- **Frontend**: React 19 + TypeScript + Vite
- **Desktop**: Tauri 2 (Rust)
- **Styling**: TailwindCSS 4 + shadcn/ui
- **UI Components**: Radix UI + Lucide React
- **Libraries**: Zod, Zustand, React Hook Forms

---

## 1. Regras Gerais

### 1.1 Nomes Significativos

Use nomes que revelem intenção. Evite nomes genéricos como `data`, `info`, `temp`, `tmp`, `val`.

```typescript
// ❌ Ruim
const d = new Date();
const temp = users.filter(u => u.active);
const arr = [1, 2, 3];

// ✅ Bom
const currentDate = new Date();
const activeUsers = users.filter(user => user.isActive);
const itemIds = [1, 2, 3];
```

### 1.2 Funções Pequenas e Responsáveis

Cada função deve fazer **uma única coisa** bem feita.

```typescript
// ❌ Ruim - faz várias coisas
function processUser(user: User) {
  validateUser(user);
  saveToDatabase(user);
  sendEmail(user);
  logActivity(user);
  return user;
}

// ✅ Bom -拆分 em funções menores
function validateUser(user: User): void {
  if (!user.email || !user.name) {
    throw new ValidationError('Invalid user data');
  }
}

async function createUser(user: User): Promise<User> {
  validateUser(user);
  const savedUser = await userRepository.save(user);
  await notifyUserCreated(savedUser);
  return savedUser;
}
```

### 1.3 Evitar Duplicação (DRY)

Não repita código. Extraia lógicas reutilizáveis.

```typescript
// ❌ Ruim - duplicação
function AdminPanel() {
  return (
    <div>
      <Button onClick={() => setShowModal(true)} variant="outline">
        Editar
      </Button>
      <Button onClick={() => setShowModal(true)} variant="outline">
        Criar
      </Button>
    </div>
  );
}

// ✅ Bom
function ActionButton({ onClick, children }: ActionButtonProps) {
  return (
    <Button onClick={onClick} variant="outline">
      {children}
    </Button>
  );
}
```

---

## 2. TypeScript

### 2.1 Tipagem Explícita

Sempre defina tipos explícitos para funções, retornos e parâmetros.

```typescript
// ❌ Ruim
function getUser(id) {
  return db.users.find(u => u.id === id);
}

// ✅ Bom
interface User {
  id: string;
  name: string;
  email: string;
}

function getUserById(id: string): User | null {
  return db.users.find(user => user.id === id) ?? null;
}
```

### 2.2 Usar `type` vs `interface`

- Use `type` para unions, intersections e aliases simples
- Use `interface` para objetos que podem ser estendidos

```typescript
// ✅ type para unions
type Status = 'pending' | 'active' | 'completed';

// ✅ interface para objetos
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ interface extensível
interface AdminUser extends User {
  role: 'admin' | 'superadmin';
  permissions: string[];
}
```

### 2.3 Evitar `any`

Nunca use `any`. Use `unknown` quando necessário e faça type narrowing.

```typescript
// ❌ Ruim
function parseData(data: any) {
  return data.value;
}

// ✅ Bom
function parseData(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String((data as { value: unknown }).value);
  }
  throw new Error('Invalid data structure');
}
```

---

## 3. React

### 3.1 Componentes Pequenos e Focados

Componentes devem ter uma única responsabilidade.

```typescript
// ❌ Ruim - componente faz muitas coisas
function UserProfile() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // 100+ linhas de código misturando UI, lógica e estado
  return (
    <div>
      {/* rendering de posts */}
      {/* form de settings */}
      {/* informações do user */}
    </div>
  );
}

// ✅ Bom - componentes separados
function UserProfile({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      <UserInfo userId={userId} />
      <UserPosts userId={userId} />
      <UserSettings userId={userId} />
    </div>
  );
}
```

### 3.2 Nomeação de Componentes

Use PascalCase para componentes e camelCase para hooks.

```typescript
// ✅ Componente
function UserCard() { return <div>...</div>; }

// ✅ Hook customizado
function useUserData(userId: string) { ... }

// ❌ Evitar
const user_card = () => <div>...</div>;
const User_Data = () => <div>...</div>;
```

### 3.3 Props com Tipagem Explícita

```typescript
// ✅ Bom - interface explícita para props
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant }))} onClick={onClick}>
      {children}
    </button>
  );
}
```

### 3.4 Extração de Lógica para Hooks

```typescript
// ❌ Ruim - lógica misturada com UI
function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  return <ul>...</ul>;
}

// ✅ Bom - lógica extraída para hook
function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { users, loading, error };
}

function UserList() {
  const { users, loading, error } = useUsers();

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  return <ul>...</ul>;
}
```

### 3.5 Evitar Props Drilling

Use Context ou composição de componentes.

```typescript
// ❌ Ruim - props drilling
function App() {
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  return <Parent theme={theme} user={user} setUser={setUser} />;
}

// ✅ Bom - Context
const ThemeContext = createContext<ThemeContextType>(defaultValue);

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Dashboard />
      </UserProvider>
    </ThemeProvider>
  );
}
```

---

## 4. Estrutura de Arquivos

### 4.1 Organização por Feature

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── index.ts
│   └── users/
│       ├── components/
│       ├── hooks/
│       └── types.ts
├── components/
│   └── ui/
├── lib/
└── types/
```

### 4.2 Arquivos de Índice (index.ts)

Use `index.ts` para exportar públicos de cada módulo.

```typescript
// features/users/index.ts
export { UserList } from './components/UserList';
export { UserCard } from './components/UserCard';
export { useUsers } from './hooks/useUsers';
export type { User, UserFilters } from './types';
```

---

## 5. Estilização (TailwindCSS)

### 5.1 usar `cn()` para Classes Condicionais

Utilize a função `cn` do `lib/utils.ts` para combinar classes.

```typescript
// ✅ Bom
import { cn } from '@/lib/utils';

function Card({ className, variant }: CardProps) {
  return (
    <div className={cn(
      'rounded-lg border p-4',
      variant === 'primary' && 'border-primary',
      className
    )}>
      {children}
    </div>
  );
}
```

### 5.2 Componentes UI Reutilizáveis

Crie componentes wrapper para UI repetitiva.

```typescript
// components/ui/Card.tsx
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'ghost';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div className={cn(
      'rounded-lg border bg-card p-6',
      variant === 'outlined' && 'border-2',
      className
    )} {...props}>
      {children}
    </div>
  );
}
```

---

## 6. Lidando com Erros

### 6.1 Tratamento de Erros Explícito

```typescript
// ❌ Ruim - ignora erros
fetch('/api/data')
  .then(res => res.json())
  .then(data => setData(data));

// ✅ Bom - tratamento adequado
async function fetchData(): Promise<Data[]> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}`, response.status);
    }
    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Network error', 0);
  }
}
```

### 6.2 Boundaries de Erro em React

```typescript
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return <ErrorFallback />;
  }

  return children;
}
```

---

## 7. Performance

### 7.1 Evitar Re-renderizados Desnecessários

```typescript
// ✅ Use useMemo e useCallback para otimizar
function ExpensiveComponent({ items, filter }: Props) {
  const filteredItems = useMemo(
    () => items.filter(item => item.name.includes(filter)),
    [items, filter]
  );

  const handleClick = useCallback((id: string) => {
    console.log('Clicked:', id);
  }, []);

  return (
    <ul>
      {filteredItems.map(item => (
        <Item key={item.id} onClick={handleClick} />
      ))}
    </ul>
  );
}
```

### 7.2 Lazy Loading de Componentes

```typescript
// ✅ Carregue rotas e componentes pesados sob demanda
const HeavyChart = lazy(() => import('./components/HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

---

## 8. Seguranca

### 8.1 Nunca Expor Dados Sensíveis

```typescript
// ❌ Ruim - expor dados sensíveis em logs
console.log('User password:', user.password);

// ✅ Bom
logger.debug('User login attempt', { userId: user.id });
```

### 8.2 Validar Entradas

```typescript
// ✅ Sempre valide dados externos
function createUser(input: unknown): User {
  if (!isValidUserInput(input)) {
    throw new ValidationError('Invalid input');
  }
  // processar dados
}
```

### 8.3 Evitar XSS

```typescript
// ❌ Ruim - injeção de scripts
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Bom - usar texto
<div>{userInput}</div>

// ou sanitizar se necessário
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

---

## 9. Testabilidade

### 9.1 Código Testável

```typescript
// ❌ Ruim - difícil de testar
function processOrder(order: Order) {
  const db = new Database();
  const email = new EmailService();
  // lógica misturada com dependências
}

// ✅ Bom - injeção de dependências
function processOrder(
  order: Order,
  orderRepository: OrderRepository,
  emailService: EmailService
) {
  // lógica de negócio isolada
}
```

### 9.2 Funções Puras

```typescript
// ✅ Função pura - determinística e testável
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```

---

## 10. Comentários e Documentação

### 10.1 Quando Commentar

Comente o "por quê", não o "o quê".

```typescript
// ✅ Bom - explica o motivo, não o código
// Usamos Math.random() para simulating network latency em dev
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ❌ Ruim - diz o que o código faz (óbvio)
/**
 * Soma dois números
 * @param a - primeiro número
 * @param b - segundo número
 */
function sum(a: number, b: number): number {
  return a + b;
}
```

### 10.2 Documentação de APIs e Types

```typescript
/**
 * Representa um usuário do sistema
 */
interface User {
  /** Identificador único */
  id: string;

  /** Nome de exibição */
  displayName: string;

  /** Email válido */
  email: string;

  /** Roles do usuário */
  roles: UserRole[];
}

/**
 * Opções para criação de usuário
 */
interface CreateUserOptions {
  /** Email do usuário (obrigatório) */
  email: string;

  /** Nome de exibição */
  displayName?: string;
}
```

---

## 11. Regras para LLMs

### 11.1 Antes de Escrever Código

1. **Analise a estrutura existente** - siga os padrões do projeto
2. **Verifique tipos existentes** - reuse interfaces definidas
3. **Considere composibilidade** - crie componentes reutilizáveis
4. **Pense em testabilidade** - escreva código fácil de testar

### 11.2 Durante a Escrita

1. **Use TypeScript rigorosamente** - sem `any`
2. **Siga as convenções de nomenclatura** - PascalCase para componentes
3. **Mantenha funções pequenas** - máximo 30-40 linhas
4. **Use early returns** - reduza aninhamento
5. **Extraia constantes** - valores mágicos devem ser nomeados

### 11.3 Após Escrever

1. **Revise nomes** - fazem sentido? revelam intenção?
2. **Verifique duplicação** - há código repetido?
3. **Teste mental** - o código é fácil de manter?
4. **Considere Edge Cases** - o que pode dar errado?

### 11.4 Code Smells a Evitar

| Smell | Exemplo | Solução |
|-------|---------|---------|
| Função longa | 100+ linhas | Extrair funções menores |
| Muitos parâmetros | 8+ parâmetros | Usar objeto de opções |
| Condições aninhadas | 4+ níveis | Usar early returns ou策略模式 |
| Variáveis genéricas | `data`, `temp` | Nomes descritivos |
| Comentários que explicam código | `// increment i` | Código mais claro |
| Duplicate código | Same logic em dois lugares | Extrair função |

---

## 12. Configuração de Linting

O projeto usa ESLint e Prettier. Execute antes de commitar:

```bash
npm run lint     # Verificar problemas
npm run format   # Formatar código
```

---

## Referências

- [Clean Code - Robert C. Martin](https://github.com/ryanmcdermott/clean-code-javascript)
- [TypeScript Best Practices](https://github.com/typescript-eslint/typescript-eslint)
- [React Hooks Rules](https://react.dev/warnings/invalid-hook-call-warning)
- [Tauri Security Guidelines](https://tauri.app/about/security/)

---

**Última atualização**: 2026-05-12