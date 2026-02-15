'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/lib/LanguageContext'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Sparkles, History, Settings, Trash2, Copy, Download, Loader2,
  Wand2, Moon, Sun, Plus, Minus, ImageIcon, Globe
} from 'lucide-react'
import { reactMarkdown } from 'react-markdown'

interface MultiplanShot {
  id: string
  description: string
  duration: string
}

interface HistoryEntry {
  id: string
  userInput: string
  generatedPrompt: string
  analysis: string
  model: string
  timestamp: string
  options: {
    styleVisuel: string[]
    ambiance: string[]
    cameraMovement: string[]
    lighting: string[]
    duration: string
    format: string
    resolution: string
    fps: string
    movementIntensity: number
    depthOfField: number
    multiplan: boolean
    multiplanShots: MultiplanShot[]
    audioDescription: string
    additionalContext: string
  }
}

interface ImageAnalysisEntry {
  id: string
  imagePreview: string
  analysis: string
  timestamp: string
}

interface AppSettings {
  defaultModel: string
  darkMode: boolean
  autoSave: boolean
}

export default function DirectorAI() {
  const { toast } = useToast()
  const { language, setLanguage, t } = useLanguage()

  // Tab state
  const [activeTab, setActiveTab] = useState('composer')

  // Model selection
  const [selectedModel, setSelectedModel] = useState('veo')

  // Main input
  const [userInput, setUserInput] = useState('')

  // Frame states
  const [startFramePreview, setStartFramePreview] = useState<string | null>(null)
  const [endFramePreview, setEndFramePreview] = useState<string | null>(null)
  const [startFrameDescription, setStartFrameDescription] = useState('')
  const [endFrameDescription, setEndFrameDescription] = useState('')

  // Multiplan state
  const [multiplanEnabled, setMultiplanEnabled] = useState(false)
  const [multiplanShots, setMultiplanShots] = useState<MultiplanShot[]>([
    { id: '1', description: '', duration: '5 secondes' }
  ])

  // Style selections
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [selectedAmbiances, setSelectedAmbiances] = useState<string[]>([])
  const [selectedCameras, setSelectedCameras] = useState<string[]>([])
  const [selectedLighting, setSelectedLighting] = useState<string[]>([])

  // Technical parameters
  const [duration, setDuration] = useState('5 secondes')
  const [format, setFormat] = useState('16:9 Paysage')
  const [resolution, setResolution] = useState('4K UHD')
  const [fps, setFps] = useState('24fps — Cinéma')
  const [movementIntensity, setMovementIntensity] = useState(6)
  const [depthOfField, setDepthOfField] = useState(7)

  // Audio & Context
  const [audioDescription, setAudioDescription] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [colorPalette, setColorPalette] = useState<string[]>([])

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [generatedAnalysis, setGeneratedAnalysis] = useState('')

  // Image to Prompt state
  const [imageToAnalyze, setImageToAnalyze] = useState<File | null>(null)
  const [imageToAnalyzePreview, setImageToAnalyzePreview] = useState<string | null>(null)
  const [imageCustomInstructions, setImageCustomInstructions] = useState('')
  const [imageTargetModel, setImageTargetModel] = useState('veo')
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)
  const [imageAnalysisResult, setImageAnalysisResult] = useState('')
  const [imageAnalysisHistory, setImageAnalysisHistory] = useState<ImageAnalysisEntry[]>([])

  // Image Generator state
  const [imageGenInput, setImageGenInput] = useState('')
  const [imageGenStyle, setImageGenStyle] = useState('')
  const [imageGenAspectRatio, setImageGenAspectRatio] = useState('1:1')
  const [imageGenQuality, setImageGenQuality] = useState('high')
  const [imageGenNegative, setImageGenNegative] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatedImagePrompt, setGeneratedImagePrompt] = useState('')
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [imageGenMode, setImageGenMode] = useState<'create' | 'transform'>('create')
  const [imageGenModel, setImageGenModel] = useState('nano-banana-pro')
  const [transformImagePreview, setTransformImagePreview] = useState<string | null>(null)

  // History and settings
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [settings, setSettings] = useState<AppSettings>({
    defaultModel: 'veo',
    darkMode: true,
    autoSave: true
  })

  // Translated arrays
  const VIDEO_MODELS = useMemo(() => [
    { id: 'veo', name: 'VEO', version: '3', description: t('modelVeo') },
    { id: 'seedance', name: 'SEEDANCE', version: '2.0', description: t('modelSeedance') },
    { id: 'kling', name: 'KLING', version: '3.0', description: t('modelKling') },
    { id: 'higgsfield', name: 'HIGGSFIELD STUDIO', version: '2.0', description: t('modelHiggsfield') }
  ], [t])

  const STYLE_VISUEL = useMemo(() => [
    t('styleCinematic4K'), t('styleHyperrealistic'), t('styleFilmGrain'), t('styleFilmNoir'),
    t('styleNeoNoir'), t('styleAnime'), t('style3DAnimation'), t('styleStopMotion'),
    t('styleDocumentary'), t('styleVintageSuper8'), t('styleFuturistic'), t('styleExpressionist'),
    t('styleSurrealist'), t('styleMinimalist')
  ], [t])

  const AMBIANCE_MOOD = useMemo(() => [
    t('moodMelancholic'), t('moodEpic'), t('moodMysterious'), t('moodRomantic'),
    t('moodAnguishing'), t('moodContemplative'), t('moodNostalgic'), t('moodDramatic'),
    t('moodDreamy'), t('moodTense'), t('moodPoetic'), t('moodJoyful')
  ], [t])

  const CAMERA_MOVEMENTS = useMemo(() => [
    t('cameraWideShot'), t('cameraCloseUp'), t('cameraAmericanShot'), t('cameraHighAngle'),
    t('cameraLowAngle'), t('cameraDollyIn'), t('cameraDollyOut'), t('cameraOrbitalPan'),
    t('cameraTracking'), t('cameraSteadicam'), t('cameraHandheld'), t('cameraDrone'),
    t('cameraPOV'), t('cameraRackFocus'), t('cameraWhipPan'), t('cameraDutchAngle'), t('cameraBirdsEye')
  ], [t])

  const LIGHTING_OPTIONS = useMemo(() => [
    t('lightGoldenHour'), t('lightBlueHour'), t('lightHard'), t('lightSoft'),
    t('lightBacklight'), t('lightCandlelight'), t('lightNeon'), t('lightMoonlight'),
    t('lightChiaroscuro'), t('lightStrobe')
  ], [t])

  const DURATION_OPTIONS = useMemo(() => [
    t('duration3s'), t('duration5s'), t('duration8s'), t('duration10s'), t('duration15s')
  ], [t])

  const FORMAT_OPTIONS = useMemo(() => [
    t('format16_9'), t('format9_16'), t('format1_1'), t('format21_9'), t('format4_3')
  ], [t])

  const RESOLUTION_OPTIONS = useMemo(() => [
    t('res720p'), t('res1080p'), t('res4K'), t('res8K')
  ], [t])

  const FPS_OPTIONS = useMemo(() => [
    t('fps24'), t('fps25'), t('fps30'), t('fps60')
  ], [t])

  // Initialize defaults when translations load
  useEffect(() => {
    setDuration(DURATION_OPTIONS[1])
    setFormat(FORMAT_OPTIONS[0])
    setResolution(RESOLUTION_OPTIONS[2])
    setFps(FPS_OPTIONS[0])
  }, [DURATION_OPTIONS, FORMAT_OPTIONS, RESOLUTION_OPTIONS, FPS_OPTIONS])

  // Load data from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('directorAI_history')
    const savedSettings = localStorage.getItem('directorAI_settings')
    const savedImageHistory = localStorage.getItem('directorAI_imageHistory')

    if (savedHistory) setHistory(JSON.parse(savedHistory))
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setSettings(parsed)
      setSelectedModel(parsed.defaultModel || 'veo')
    }
    if (savedImageHistory) setImageAnalysisHistory(JSON.parse(savedImageHistory))
  }, [])

  // Save functions
  const saveHistory = useCallback((newHistory: HistoryEntry[]) => {
    localStorage.setItem('directorAI_history', JSON.stringify(newHistory))
    setHistory(newHistory)
  }, [])

  const saveSettings = useCallback((newSettings: AppSettings) => {
    localStorage.setItem('directorAI_settings', JSON.stringify(newSettings))
    setSettings(newSettings)
  }, [])

  const saveImageHistory = useCallback((newHistory: ImageAnalysisEntry[]) => {
    localStorage.setItem('directorAI_imageHistory', JSON.stringify(newHistory))
    setImageAnalysisHistory(newHistory)
  }, [])

  // Toggle multi-select
  const toggleSelection = (item: string, selected: string[], setSelected: (v: string[]) => void) => {
    if (selected.includes(item)) {
      setSelected(selected.filter(i => i !== item))
    } else {
      setSelected([...selected, item])
    }
  }

  // Handle frame upload
  const handleFrameUpload = (type: 'start' | 'end', file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: t('toastInvalidFormat'), description: t('toastInvalidFormatDescription'), variant: 'destructive' })
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = e.target?.result as string
      if (type === 'start') {
        setStartFramePreview(preview)
      } else {
        setEndFramePreview(preview)
      }
    }
    reader.readAsDataURL(file)
  }

  // Clear frame
  const clearFrame = (type: 'start' | 'end') => {
    if (type === 'start') {
      setStartFramePreview(null)
      setStartFrameDescription('')
    } else {
      setEndFramePreview(null)
      setEndFrameDescription('')
    }
  }

  // Multiplan shot management
  const addShot = () => {
    setMultiplanShots([...multiplanShots, { id: Date.now().toString(), description: '', duration: duration }])
  }

  const removeShot = (id: string) => {
    if (multiplanShots.length > 1) {
      setMultiplanShots(multiplanShots.filter(s => s.id !== id))
    }
  }

  const updateShot = (id: string, field: 'description' | 'duration', value: string) => {
    setMultiplanShots(multiplanShots.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  // Generate prompt
  const generatePrompt = async () => {
    if (!userInput.trim()) {
      toast({ title: t('toastInputRequired'), description: t('toastInputRequiredDescription'), variant: 'destructive' })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          model: VIDEO_MODELS.find(m => m.id === selectedModel)?.name || selectedModel,
          multiplan: multiplanEnabled && (selectedModel === 'kling' || selectedModel === 'higgsfield'),
          multiplanShots: multiplanEnabled ? multiplanShots : undefined,
          startFrameDescription: startFrameDescription || undefined,
          endFrameDescription: endFrameDescription || undefined,
          styleVisuel: selectedStyles,
          ambiance: selectedAmbiances,
          cameraMovement: selectedCameras,
          lighting: selectedLighting,
          duration, format, resolution, fps,
          movementIntensity, depthOfField,
          audioDescription: selectedModel === 'veo' ? audioDescription : undefined,
          additionalContext,
          colorPalette
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Error generating prompt')

      const fullResponse = data.prompt
      const isMultiplanResponse = data.multiplan || fullResponse.includes('## 🎬 PLAN')

      let analysisPart = ''
      let promptPart = fullResponse

      if (isMultiplanResponse) {
        const overviewMatch = fullResponse.match(/## SEQUENCE OVERVIEW\n([\s\S]*?)(?=\n---|\n## 🎬 PLAN)/)
        if (overviewMatch) analysisPart = overviewMatch[1].trim()
        setGeneratedPrompt(fullResponse)
      } else {
        const parts = fullResponse.split('## FINAL VIDEO GENERATION PROMPT')
        analysisPart = parts[0]?.replace('## Logical Reasoning & Analysis', '').trim() || ''
        promptPart = parts[1] || fullResponse
        setGeneratedPrompt(promptPart.trim())
      }

      setGeneratedAnalysis(analysisPart)

      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        userInput,
        generatedPrompt: isMultiplanResponse ? fullResponse : promptPart.trim(),
        analysis: analysisPart,
        model: VIDEO_MODELS.find(m => m.id === selectedModel)?.name || selectedModel,
        timestamp: new Date().toISOString(),
        options: {
          styleVisuel: selectedStyles, ambiance: selectedAmbiances, cameraMovement: selectedCameras,
          lighting: selectedLighting, duration, format, resolution, fps,
          movementIntensity, depthOfField, multiplan: multiplanEnabled, multiplanShots,
          audioDescription, additionalContext
        }
      }

      saveHistory([newEntry, ...history].slice(0, 100))
      toast({ title: t('toastPromptGenerated'), description: t('toastPromptDescription') })

    } catch (error) {
      console.error('Generation error:', error)
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'An error occurred.', variant: 'destructive' })
    } finally {
      setIsGenerating(false)
    }
  }

  // Analyze image
  const analyzeImage = async () => {
    if (!imageToAnalyze || !imageToAnalyzePreview) {
      toast({ title: t('toastInvalidFormat'), description: t('toastInvalidFormatDescription'), variant: 'destructive' })
      return
    }

    setIsAnalyzingImage(true)
    setImageAnalysisResult('')

    try {
      const base64Parts = imageToAnalyzePreview.split(',')
      if (base64Parts.length < 2) throw new Error('Invalid image format')

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Parts[1],
          mimeType: 'image/jpeg',
          customInstructions: imageCustomInstructions || undefined,
          targetModel: VIDEO_MODELS.find(m => m.id === imageTargetModel)?.name
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Analysis failed')
      if (!data.analysis) throw new Error('No analysis result')

      setImageAnalysisResult(data.analysis)

      const newEntry: ImageAnalysisEntry = {
        id: Date.now().toString(),
        imagePreview: imageToAnalyzePreview,
        analysis: data.analysis,
        timestamp: new Date().toISOString()
      }

      saveImageHistory([newEntry, ...imageAnalysisHistory].slice(0, 20))
      toast({ title: 'Image analysée !', description: 'Video prompt generated from your image.' })

    } catch (error) {
      console.error('Image analysis error:', error)
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'An error occurred.', variant: 'destructive' })
    } finally {
      setIsAnalyzingImage(false)
    }
  }

  // Generate image
  const generateImage = async () => {
    if (!imageGenInput.trim()) {
      toast({ title: 'Description required', description: 'Please describe the image.', variant: 'destructive' })
      return
    }

    setIsGeneratingImage(true)
    setGeneratedImagePrompt('')
    setGeneratedImageUrl(null)

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: imageGenMode,
          userInput: imageGenInput,
          model: imageGenModel,
          style: imageGenStyle || undefined,
          aspectRatio: imageGenAspectRatio,
          quality: imageGenQuality,
          negativePrompt: imageGenNegative || undefined
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Generation failed')

      setGeneratedImagePrompt(data.prompt)
      if (data.imageUrl) setGeneratedImageUrl(data.imageUrl)
      toast({ title: data.imageUrl ? 'Image generated!' : 'Prompt generated!' })

    } catch (error) {
      console.error('Image generation error:', error)
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'An error occurred.', variant: 'destructive' })
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: t('toastCopied'), description: t('toastCopiedDescription') })
  }

  // Download prompt
  const downloadPrompt = () => {
    const content = `=== ANALYSIS ===\n${generatedAnalysis}\n\n=== FINAL PROMPT ===\n${generatedPrompt}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `director-ai-prompt-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // History functions
  const deleteHistoryEntry = (id: string) => {
    saveHistory(history.filter(e => e.id !== id))
    toast({ title: 'Deleted' })
  }

  const clearHistory = () => {
    saveHistory([])
    toast({ title: 'History cleared' })
  }

  const loadFromHistory = (entry: HistoryEntry) => {
    setUserInput(entry.userInput)
    setGeneratedPrompt(entry.generatedPrompt)
    setGeneratedAnalysis(entry.analysis)
    const modelEntry = VIDEO_MODELS.find(m => m.name === entry.model)
    if (modelEntry) setSelectedModel(modelEntry.id)
    setSelectedStyles(entry.options.styleVisuel)
    setSelectedAmbiances(entry.options.ambiance)
    setSelectedCameras(entry.options.cameraMovement)
    setSelectedLighting(entry.options.lighting)
    setDuration(entry.options.duration)
    setFormat(entry.options.format)
    setResolution(entry.options.resolution)
    setFps(entry.options.fps)
    setMovementIntensity(entry.options.movementIntensity)
    setDepthOfField(entry.options.depthOfField)
    setMultiplanEnabled(entry.options.multiplan)
    setMultiplanShots(entry.options.multiplanShots)
    setAudioDescription(entry.options.audioDescription)
    setAdditionalContext(entry.options.additionalContext)
    setActiveTab('composer')
    toast({ title: 'Loaded', description: 'Prompt loaded in editor.' })
  }

  // Check if multiplan is available
  const multiplanAvailable = selectedModel === 'kling' || selectedModel === 'higgsfield'

  // Color palette options
  const COLOR_PALETTE = [
    '#1a1a2e', '#16213e', '#0f3460', '#e94560', '#ff6b6b',
    '#feca57', '#48dbfb', '#1dd1a1', '#FF6B6B', '#4ECDC4',
    '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#F39C12', '#3498DB'
  ]
