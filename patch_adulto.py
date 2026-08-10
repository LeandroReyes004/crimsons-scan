import os

page_path = 'frontend/src/app/page.tsx'
adulto_path = 'frontend/src/app/adulto/page.tsx'

with open(page_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace API call
content = content.replace("fetch(`${API}/api/mangas`)", "fetch(`${API}/api/mangas/adulto`)")
content = content.replace("export default function Home() {", """const STORAGE_KEY = 'cs_age_confirmed';

export default function AdultoPage() {""")

# Add confirmed state
state_block = """  const [user, setUser]         = useState<ReturnType<typeof getUser>>(null);"""
new_state_block = """  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [user, setUser]         = useState<ReturnType<typeof getUser>>(null);"""
content = content.replace(state_block, new_state_block)

# Add confirmed effect
effect_block = """  useEffect(() => {
    checkVersion();"""
new_effect_block = """  useEffect(() => {
    setConfirmed(localStorage.getItem(STORAGE_KEY) === 'yes');
  }, []);

  useEffect(() => {
    checkVersion();"""
content = content.replace(effect_block, new_effect_block)

# Add modal wrapper
return_stmt = "  return (\n    <div "
modal_code = """
  if (confirmed === null) return null;

  if (!confirmed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-rose-500/20 max-w-md w-full p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
            <Flame className="text-rose-500" size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Contenido +18</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            Esta sección contiene material explícito solo para adultos. Debes tener 18 años o más para ingresar.
          </p>
          <div className="flex w-full gap-3">
            <button
              onClick={() => { localStorage.setItem(STORAGE_KEY, 'yes'); setConfirmed(true); }}
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition"
            >
              Soy mayor de 18
            </button>
            <Link
              href="/"
              className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white font-bold py-3 rounded-xl transition flex items-center justify-center"
            >
              Salir
            </Link>
          </div>
        </div>
      </div>
    );
  }

"""
content = content.replace(return_stmt, modal_code + return_stmt)

with open(adulto_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Adulto page patched successfully.")
