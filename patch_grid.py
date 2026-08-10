with open('frontend/src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Change max-w-xl to max-w-5xl
code = code.replace(
    '<div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-xl">',
    '<div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-5xl">'
)

# 2. Insert grid start and left column wrapper
header_end = '        <p className="text-gray-500 text-sm mt-1">Miembros y notificaciones</p>\n      </div>'
new_header_end = header_end + '\n\n      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">\n        <div className="flex flex-col gap-6">'
code = code.replace(header_end, new_header_end)

# 3. Insert column split
tu_scan_end = '                </div>\n              )}\n            </div>\n          </div>'
telegram_start = '          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5">\n            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bot de Telegram</p>'
target_split = tu_scan_end + '\n' + telegram_start
new_split = tu_scan_end + '\n        </div>\n        <div className="flex flex-col gap-6">\n' + telegram_start
code = code.replace(target_split, new_split)

# 4. Insert grid end before the end of the component
redes_end = '              </button>\n            </div>\n          </div>\n        </>\n      )}\n    </div>\n  );\n}'
new_redes_end = '              </button>\n            </div>\n          </div>\n        </div>\n        </>\n      )}\n      </div>\n    </div>\n  );\n}'
code = code.replace(redes_end, new_redes_end)

with open('frontend/src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print('Success')
