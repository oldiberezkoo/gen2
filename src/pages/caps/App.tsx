// написан на скорую руку, если что-то не так с этим кодом, пишите мне в telegram @oldiberezko

import { ArrowRight, Check, Copy, Moon, Sun, Trash } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

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
	s: "s",
	t: "ᴛ",
	u: "ᴜ",
	v: "ᴠ",
	w: "ᴡ",
	x: "x",
	y: "ʏ",
	z: "ᴢ",
}

// hex
const minecraftColorCodes = /§[0-9a-fk-or]|&[0-9a-fk-or]/g
const rgbHexRegex = /&#[0-9a-fA-F]{6}|<#([0-9a-fA-F]{6})>/

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

const extendedRussianMap: Record<string, string> = {
	...russianMap,
	ё: "ᴇ",
	щ: "щ",
	ю: "ю",
	я: "я",
}

const extendedEnglishMap: Record<string, string> = {
	...englishMap,
	ñ: "ɴ",
	é: "ᴇ",
	è: "ᴇ",
	ê: "ᴇ",
	q: "ǫ",
	Q: "ǫ",
	r: "ʀ",
	i: "ɪ",
	f: "ꜰ",

	x: "x",
}
/**
 * Переводит текст в упрощенный стиль, используя
 * следующие правила:
 *
 * - сохраняет цветовые коды Minecraft (&x) и RGB (&#xxxxxx)
 * - заменяет буквы русского алфавита на их "упрощенный"
 *   аналог (например, "а" -> "ᴀ")
 * - заменяет буквы английского алфавита на их "упрощенный"
 *   аналог (например, "e" -> "ᴇ")
 * - заменяет цифры на их "упрощенный" аналог (например, "0"
 *   -> "₀")
 *
 * @param {string} input
 * @returns {string}
 */

const translateText = (input: string): string => {
	let result = ""

	// Преобразуем входной текст к нижнему регистру для более стабильного перевода
	const normalizedInput = input.toLowerCase()

	for (let i = 0; i < normalizedInput.length; i++) {
		const char = normalizedInput[i]
		const remainingText = normalizedInput.slice(i)

		// Сохраняем цветовые коды Minecraft и RGB
		const mcColorMatch = remainingText.match(minecraftColorCodes)
		const rgbHexMatch = remainingText.match(rgbHexRegex)

		if (mcColorMatch && mcColorMatch.index === 0) {
			result += mcColorMatch[0]
			i += mcColorMatch[0].length - 1
			continue
		}

		if (rgbHexMatch && rgbHexMatch.index === 0) {
			result += rgbHexMatch[0]
			i += rgbHexMatch[0].length - 1
			continue
		}

		// Обработка специальных символов
		if (char === "&" && i < normalizedInput.length - 1 && /\d/.test(normalizedInput[i + 1])) {
			result += char + normalizedInput[i + 1]
			i++
			continue
		}

		// Преобразование букв
		if (extendedRussianMap[char]) {
			result += extendedRussianMap[char]
		} else if (extendedEnglishMap[char]) {
			result += extendedEnglishMap[char]
		} else if (numbersMap[char]) {
			result += numbersMap[char]
		} else {
			result += char
		}
	}
	return result
}

const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			isDarkMode: false,
			history: [],
			sourceText: "",
			translatedText: "",
			toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
			addToHistory: (item) => {
				set((state) => {
					const newItem = { id: Date.now().toString(), ...item, timestamp: Date.now() }
					const isDuplicate = state.history.some(
						(historyItem) => historyItem.source === newItem.source && historyItem.translated === newItem.translated
					)
					if (!isDuplicate) {
						return { history: [newItem, ...state.history] }
					}
					return state
				})
			},
			clearHistory: () => set({ history: [] }),
			removeHistoryItem: (id) => {
				set((state) => ({
					history: state.history.filter((item) => item.id !== id),
				}))
			},
			setSourceText: (text: string) => set({ sourceText: text }),
			setTranslatedText: (text: string) => set({ translatedText: text }),
		}),
		{
			name: "gen2-storage",
			partialize: (state) => ({ isDarkMode: state.isDarkMode, history: state.history }),
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
						onChange={(e) => setSourceText(e.target.value)}
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
			<section className='p-4 my-2 w-full flex items-center justify-center'>
				<a href='https://t.me/oldiberezko' target='_blank'>
					powered by{" "}
					<span className='font-bold text-transparent bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text animate-rainbow'>
						oldiberezko
					</span>
				</a>
			</section>
		</div>
	)
}
