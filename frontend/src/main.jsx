import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        appearance={{
          variables: {
            colorPrimary: '#191a1d',
            colorBackground: '#ffffff',
            colorSurface: '#f4f5f7',
            colorText: '#111214',
            colorTextSecondary: '#5f6672',
            colorInputBackground: '#f7f8fa',
            colorInputText: '#111214',
            borderRadius: '1rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          },
          elements: {
            card: 'bg-white border border-[#e5e7eb] shadow-xl rounded-3xl',
            headerTitle: 'text-[#111214] text-xl font-black tracking-tight',
            headerSubtitle: 'text-[#5f6672] text-sm',
            formFieldLabel: 'text-[#111214] text-xs font-bold uppercase tracking-wider',
            formFieldInput: 'bg-[#f7f8fa] border border-[#e2e4e8] text-[#111214] rounded-xl text-sm py-2.5 px-4 focus:border-[#191a1d] focus:ring-2 focus:ring-[#191a1d]/10',
            formButtonPrimary: 'bg-[#191a1d] hover:bg-[#2b2e34] text-white font-bold rounded-full py-3 shadow-md transition-all active:scale-95',
            otpCodeFieldInputs: 'gap-2 justify-center my-4',
            otpCodeFieldInput: 'bg-[#f7f8fa] border-2 border-[#e2e4e8] text-[#111214] font-black font-mono text-2xl rounded-xl text-center w-12 h-14 focus:border-[#191a1d]',
            userButtonPopoverCard: 'bg-white border border-[#e5e7eb] shadow-xl rounded-2xl p-2',
            userButtonPopoverActionButton: 'hover:bg-[#f3f4f6] text-[#111214] rounded-xl py-2 px-3',
            userButtonPopoverActionButtonText: 'text-[#111214] font-bold text-sm',
            userButtonPopoverFooter: 'hidden',
          },
        }}
      >
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)
