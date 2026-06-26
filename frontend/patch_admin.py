with open('src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

return_idx = code.find('return (\n    <div className="h-screen overflow-hidden flex bg-gray-50')
if return_idx == -1:
    print('Not found')
else:
    modal_code = '''  const needsContract = user && user.scan_id && !user.is_superadmin && (user.scan_contrato_version || 0) < (user.global_contrato_version || 1);

  return (
    <div className="h-screen overflow-hidden flex bg-gray-50 dark:bg-[#07070a] text-gray-900 dark:text-gray-100 font-sans">
      {needsContract && <ContractModal scanId={user.scan_id} onClose={() => {}} />}'''
      
    code = code.replace('return (\n    <div className="h-screen overflow-hidden flex bg-gray-50 dark:bg-[#07070a] text-gray-900 dark:text-gray-100 font-sans">', modal_code)

    with open('src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print('Injected ContractModal successfully')
