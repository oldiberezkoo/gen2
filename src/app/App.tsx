// написан на скорую руку, если что-то не так с этим кодом, пишите мне в telegram @oldiberezko

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Sun, Moon, Trash, ArrowRight, Copy, Check } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"

interface HistoryItem {
	id: string
	source: string
	translated: string
	timestamp: number
}

interface AppState {
	isDarkMode: boolean
	history: HistoryItem[]
	sourceText: string
	translatedText: string
	toggleTheme: () => void
	addToHistory: (item: Omit<HistoryItem, "id" | "timestamp">) => void
	clearHistory: () => void
	removeHistoryItem: (id: string) => void
	setSourceText: (text: string) => void
	setTranslatedText: (text: string) => void
}

const russianMap: Record<string, string> = {
	а: "ᴀ",
	б: "б",
	в: "ʙ",
	г: "г",
	д: "д",
	е: "ᴇ",
	ж: "ж",
	з: "з",
	и: "и",
	й: "й",
	к: "ᴋ",
	л: "л",
	м: "м",
	н: "ʜ",
	о: "ᴏ",
	п: "п",
	р: "ᴘ",
	с: "ᴄ",
	т: "т",
	у: "ʏ",
	ф: "ȹ",
	х: "x",
	ц: "ц",
	ч: "ч",
	ш: "ш",
	щ: "щ",
	ъ: "ъ",
	ы: "ы",
	ь: "ь",
	э: "э",
	ю: "ю",
	я: "я",
}

const englishMap: Record<string, string> = {
	a: "ᴀ",
	b: "ʙ",
	c: "ᴄ",
	d: "ᴅ",
	e: "ᴇ",
	f: "ғ",
	g: "ɢ",
	h: "ʜ",
	i: "ɪ",
	j: "ᴊ",
	k: "ᴋ",
	l: "ʟ",
	m: "ᴍ",
	n: "ɴ",
	o: "ᴏ",
	p: "ᴘ",
	q: "ǫ",
	r: "ʀ",
	s: "ꜱ",
	t: "ᴛ",
	u: "ᴜ",
	v: "ᴠ",
	w: "ᴡ",
	x: "x",
	y: "ʏ",
	z: "ᴢ",
}

const numbersMap: Record<string, string> = {
	"0": "₀",
	"1": "₁",
	"2": "₂",
	"3": "₃",
	"4": "₄",
	"5": "₅",
	"6": "₆",
	"7": "₇",
	"8": "₈",
	"9": "₉",
}
const translateText = (input: string): string => {
	return input
		.split("")
		.map(char => {
			const lowerChar = char.toLowerCase()
			if (russianMap[lowerChar]) {
				return char === char.toUpperCase() ? russianMap[lowerChar].toUpperCase() : russianMap[lowerChar]
			} else if (englishMap[lowerChar]) {
				return char === char.toUpperCase() ? englishMap[lowerChar].toUpperCase() : englishMap[lowerChar]
			} else if (numbersMap[char]) {
				return numbersMap[char]
			}
			return char
		})
		.join("")
}

const useAppStore = create<AppState>()(
	persist(
		set => ({
			isDarkMode: false,
			history: [],
			sourceText: "",
			translatedText: "",
			toggleTheme: () => set(state => ({ isDarkMode: !state.isDarkMode })),
			addToHistory: item => {
				set(state => {
					const newItem = { id: Date.now().toString(), ...item, timestamp: Date.now() }
					const isDuplicate = state.history.some(
						historyItem => historyItem.source === newItem.source && historyItem.translated === newItem.translated
					)
					if (!isDuplicate) {
						return { history: [newItem, ...state.history] }
					}
					return state
				})
			},
			clearHistory: () => set({ history: [] }),
			removeHistoryItem: id => {
				set(state => ({
					history: state.history.filter(item => item.id !== id),
				}))
			},
			setSourceText: (text: string) => set({ sourceText: text }),
			setTranslatedText: (text: string) => set({ translatedText: text }),
		}),
		{
			name: "gen2-storage",
			partialize: state => ({ isDarkMode: state.isDarkMode, history: state.history }),
		}
	)
)

export default function App() {
	const {
		isDarkMode,
		history,
		sourceText,
		translatedText,
		toggleTheme,
		addToHistory,
		clearHistory,
		removeHistoryItem,
		setSourceText,
		setTranslatedText,
	} = useAppStore()

	const [copiedId, setCopiedId] = useState<string | null>(null)
	const saveTimeout = useRef<NodeJS.Timeout | null>(null)

	const handleTranslate = useCallback(
		(text: string) => {
			const result = translateText(text)
			setTranslatedText(result)

			if (saveTimeout.current) {
				clearTimeout(saveTimeout.current)
			}

			saveTimeout.current = setTimeout(() => {
				if (text.trim() !== "") {
					addToHistory({ source: text, translated: result })
				}
			}, 1000)
		},
		[addToHistory, setTranslatedText]
	)

	useEffect(() => {
		handleTranslate(sourceText)
	}, [sourceText, handleTranslate])

	useEffect(() => {
		document.documentElement.classList.toggle("dark", isDarkMode)
	}, [isDarkMode])

	const copyToClipboard = useCallback((text: string, id: string) => {
		navigator.clipboard.writeText(text).then(() => {
			setCopiedId(id)
			setTimeout(() => setCopiedId(null), 2000)
		})
	}, [])

	const renderHistoryItem = useCallback(
		({ id, source, translated, timestamp }: HistoryItem) => (
			<div
				key={id}
				className='w-full flex flex-row items-center justify-between gap-4 bg-slate-100 dark:bg-stone-700 rounded-xl p-2 mb-2'
			>
				<div className='flex items-center gap-2'>
					<ArrowRight size={16} />
					<p className='text-sm'>
						<span className='font-medium'>{source}</span> - {translated}
					</p>
				</div>
				<div className='flex items-center gap-2'>
					<button
						onClick={() => copyToClipboard(translated, id)}
						className='p-1 rounded-md hover:bg-slate-200 dark:hover:bg-stone-600 transition-colors'
						title='Copy translated text'
					>
						{copiedId === id ? <Check size={16} className='text-green-500' /> : <Copy size={16} />}
					</button>
					<button
						onClick={() => removeHistoryItem(id)}
						className='p-1 rounded-md hover:bg-slate-200 dark:hover:bg-stone-600 transition-colors'
						title='Remove from history'
					>
						<Trash size={16} />
					</button>
					<span className='text-xs text-gray-500'>{new Date(timestamp).toLocaleTimeString()}</span>
				</div>
			</div>
		),
		[copyToClipboard, copiedId, removeHistoryItem]
	)

	return (
		<div className='container mx-auto px-4 py-8'>
			<header className='mb-6 flex items-center justify-between'>
				<h1 className='text-3xl font-bold'>Gen2</h1>
				<button
					onClick={toggleTheme}
					className='flex items-center justify-center p-3 rounded-md border hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors'
					aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
				>
					{isDarkMode ? <Moon className='size-5' /> : <Sun className='size-5' />}
				</button>
			</header>

			<main className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<section className='border p-4 flex flex-col items-start rounded-lg dark:border-stone-600 dark:bg-stone-900'>
					<h2 className='text-xl font-medium mb-4'>Source Text</h2>
					<textarea
						placeholder='Enter text to translate'
						value={sourceText}
						onChange={e => setSourceText(e.target.value)}
						rows={5}
						className='w-full p-3 border rounded-md focus:outline-none focus:ring focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-600 resize-none'
					/>
				</section>

				<section className='border p-4 flex flex-col items-start rounded-lg dark:border-stone-600 dark:bg-stone-900'>
					<h2 className='text-xl font-medium mb-4'>Translated Text</h2>
					<textarea
						placeholder='Translation will appear here'
						value={translatedText}
						readOnly
						rows={5}
						className='w-full p-3 border rounded-md focus:outline-none focus:ring focus:ring-stone-500 dark:bg-stone-800 dark:border-stone-600 resize-none'
					/>
				</section>
			</main>

			<section className='mt-8 border rounded-md dark:border-stone-600'>
				<div className='flex items-center justify-between p-4 border-b dark:border-stone-600'>
					<h2 className='text-2xl font-medium'>Translation History</h2>
					<button
						onClick={clearHistory}
						className='flex items-center justify-center p-2 rounded-md border hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors'
						aria-label='Clear history'
					>
						<Trash className='size-4' />
					</button>
				</div>
				<div className='p-4'>
					{history.length === 0 ? (
						<p className='text-center text-gray-500'>No translation history.</p>
					) : (
						history.map(renderHistoryItem)
					)}
				</div>
			</section>
		</div>
	)
}
