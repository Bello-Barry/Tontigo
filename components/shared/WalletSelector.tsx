import Image from 'next/image'

interface WalletSelectorProps {
  selected: 'mtn' | 'airtel'
  onSelect: (w: 'mtn' | 'airtel') => void
}

export function WalletSelector({ selected, onSelect }: WalletSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div 
        onClick={() => onSelect('mtn')}
        className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center transition-all ${
          selected === 'mtn' ? 'border-yellow-500 bg-yellow-500/10' : 'border-border hover:bg-muted'
        }`}
      >
        {/* Placeholder pour le logo, remplacer par un vrai logo si dispo */}
        <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold mb-2">MTN</div>
        <span className="font-medium">Mobile Money</span>
      </div>
      
      <div 
        onClick={() => onSelect('airtel')}
        className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center transition-all ${
          selected === 'airtel' ? 'border-red-500 bg-red-500/10' : 'border-border hover:bg-muted'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white font-bold mb-2">Airtel</div>
        <span className="font-medium">Airtel Money</span>
      </div>
    </div>
  )
}
