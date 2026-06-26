import re

with open('src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add state variables
state_vars = r'''  const [showForm, setShowForm]       = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [contractText, setContractText] = useState('');
  const [contractSaving, setContractSaving] = useState(false);
  const [contractMsg, setContractMsg] = useState<string | null>(null);

  const loadContract = async () => {
    try {
      const res = await fetch(`${API}/api/config/contrato`);
      const d = await res.json();
      setContractText(d.texto || '');
    } catch {}
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setContractSaving(true);
    setContractMsg(null);
    try {
      const res = await fetch(`${API}/api/admin/config/contrato`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: contractText }),
      });
      if (res.ok) setContractMsg('Contrato actualizado y versin incrementada.');
      else setContractMsg('Error al guardar el contrato.');
    } catch {
      setContractMsg('Error de red.');
    } finally { setContractSaving(false); }
  };'''

code = code.replace('  const [showForm, setShowForm]       = useState(false);', state_vars)

# 2. Add button
buttons = r'''        {isSuperAdmin && (
          <div className="flex gap-3">
            <button onClick={() => { setShowContractForm(!showContractForm); setShowForm(false); if (!showContractForm) loadContract(); }}
              className="flex items-center gap-2 bg-[#1a1a24] hover:bg-[#252533] border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all">
              <Edit3 size={16}/> Editar Contrato
            </button>
            <button onClick={() => { setShowForm(!showForm); setShowContractForm(false); }}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-600/20">
              <Plus size={16}/> Nuevo Scan
            </button>
          </div>
        )}'''

code = code.replace(r'''        {isSuperAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-600/20">
            <Plus size={16}/> Nuevo Scan
          </button>
        )}''', buttons)

# 3. Add contract form UI
contract_form = r'''      {showContractForm && isSuperAdmin && (
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl animate-in slide-in-from-top-2 duration-300">
          <h3 className="font-bold dark:text-white mb-2 flex items-center gap-2"><Edit3 size={16} className="text-rose-500"/> Editar Contrato de Alianza</h3>
          <p className="text-sm text-gray-500 mb-5">El texto se mostrar a los administradores de scan. Al guardar, se exigir que todos vuelvan a firmar.</p>
          {contractMsg && (
            <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${contractMsg.includes('Error') ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {contractMsg}
            </div>
          )}
          <form onSubmit={handleSaveContract} className="flex flex-col gap-4">
            <div>
              <textarea 
                value={contractText} onChange={e => setContractText(e.target.value)} required rows={15}
                className="w-full bg-gray-50 dark:bg-[#07070a] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 dark:text-white focus:outline-none focus:border-rose-500 transition-colors resize-y font-mono text-sm"
                placeholder="Escribe el contrato aqu..."
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={contractSaving} className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition-all">
                {contractSaving ? 'Guardando...' : 'Guardar Nueva Versin'}
              </button>
            </div>
          </form>
        </div>
      )}'''

code = code.replace('      {showForm && isSuperAdmin && (', contract_form + '\n\n      {showForm && isSuperAdmin && (')

with open('src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print('Patched contract editor successfully')
