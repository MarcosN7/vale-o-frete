import { useState, useEffect, useCallback } from 'react';
import { setOnboardingCompleted } from '../utils';

const TOUR_STEPS = [
  {
    id: 'welcome',
    targetSelector: '.hero-section',
    title: 'Bem-vindo ao Vale o Frete!',
    text: 'Sua ferramenta profissional de análise financeira. Descubra em segundos se um frete realmente vale a pena antes de ligar o motor.',
    emoji: '🚚',
    position: 'bottom',
  },
  {
    id: 'valor',
    targetSelector: '#tour-valor-frete',
    title: '1. Informe o valor do frete',
    text: 'Digite o valor bruto total oferecido pelo cliente ou pelo aplicativo de intermediação.',
    emoji: '💰',
    position: 'bottom',
  },
  {
    id: 'plataforma',
    targetSelector: '#tour-plataforma',
    title: '2. Taxas das plataformas',
    text: 'Selecione inDrive, Lalamove, Uber, 99 ou Frete Direto para descontar as comissões automaticamente e ver sua receita líquida real.',
    emoji: '🏢',
    position: 'bottom',
  },
  {
    id: 'distancia',
    targetSelector: '#tour-distancia-retorno',
    title: '3. Distância e Retorno Vazio',
    text: 'Informe a distância e ative o switch de Retorno Vazio se for voltar sem carga. O app calcula o custo real de ida + volta.',
    emoji: '🔄',
    position: 'bottom',
  },
  {
    id: 'despesas',
    targetSelector: '#tour-despesas',
    title: '4. Pedágios e Custos Extras',
    text: 'Inclua pedágios previstos e expanda para adicionar custos de alimentação, hospedagem e ajudantes se necessário.',
    emoji: '🛣️',
    position: 'top',
  },
  {
    id: 'veiculo',
    targetSelector: '.header-actions',
    title: '5. Meu Veículo e Preços ANP',
    text: 'Ajuste o consumo do seu veículo (Caminhão, Carreta, Van, Carro, Moto) e preços de combustível pelo GPS a qualquer momento.',
    emoji: '⚙️',
    position: 'bottom',
  },
  {
    id: 'calc',
    targetSelector: '#tour-calc-btn',
    title: '6. Veredito e Lucro Real',
    text: 'Tudo pronto! Clique em calcular para ver o veredito inteligente 🟢🟡🔴, seu lucro por km e comparar com outras plataformas.',
    emoji: '🚀',
    position: 'top',
  },
];

export default function OnboardingTour({ isOpen, onClose }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Atualizar a posição do elemento alvo
  const updatePosition = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
        viewportTop: rect.top,
        viewportLeft: rect.left,
      });

      // Rolar suavemente para o elemento se estiver fora da tela
      const isOutOfView = rect.top < 80 || rect.bottom > window.innerHeight - 80;
      if (isOutOfView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      
      const timer = setTimeout(updatePosition, 100);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
        clearTimeout(timer);
      };
    }
  }, [isOpen, currentStepIndex, updatePosition]);

  // Navegação por teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    setOnboardingCompleted(true);
    onClose();
  };

  const handleComplete = () => {
    setOnboardingCompleted(true);
    onClose();
  };

  // Cálculo da posição do Tooltip
  let tooltipStyle = {};
  if (targetRect) {
    const isMobile = window.innerWidth < 640;
    const tooltipWidth = isMobile ? Math.min(window.innerWidth - 32, 360) : 380;
    const padding = 12;

    // Centro horizontal do elemento
    let left = targetRect.viewportLeft + (targetRect.width / 2) - (tooltipWidth / 2);
    // Limitar às margens da tela
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

    // Decidir se posiciona acima ou abaixo
    const spaceBelow = window.innerHeight - (targetRect.viewportTop + targetRect.height);
    const spaceAbove = targetRect.viewportTop;

    let top;
    if (currentStep.position === 'top' && spaceAbove > 200) {
      top = targetRect.viewportTop - padding - 220; // acima
    } else if (spaceBelow > 220 || spaceBelow >= spaceAbove) {
      top = targetRect.viewportTop + targetRect.height + padding; // abaixo
    } else {
      top = Math.max(20, targetRect.viewportTop - 220); // fallback acima
    }

    tooltipStyle = {
      position: 'fixed',
      top: `${Math.max(16, Math.min(top, window.innerHeight - 260))}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    };
  } else {
    // Fallback centralizado se o elemento não for encontrado
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'min(90vw, 400px)',
    };
  }

  return (
    <div className="onboarding-tour-root">
      {/* Overlay escuro */}
      <div className="tour-backdrop" onClick={handleSkip} />

      {/* Spotlight no elemento atual */}
      {targetRect && (
        <div
          className="tour-spotlight"
          style={{
            top: `${targetRect.viewportTop - 6}px`,
            left: `${targetRect.viewportLeft - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
        />
      )}

      {/* Caixa / Tooltip Explicativo */}
      <div className="tour-tooltip" style={tooltipStyle}>
        <div className="tour-tooltip-header">
          <div className="tour-badge">
            <span>{currentStep.emoji}</span>
            <span>Passo {currentStepIndex + 1} de {TOUR_STEPS.length}</span>
          </div>
          <button
            type="button"
            className="tour-close-btn"
            onClick={handleSkip}
            title="Pular tutorial"
          >
            ✕
          </button>
        </div>

        <h3 className="tour-title">{currentStep.title}</h3>
        <p className="tour-text">{currentStep.text}</p>

        {/* Indicadores de progresso (pontos) */}
        <div className="tour-dots">
          {TOUR_STEPS.map((step, idx) => (
            <span
              key={step.id}
              className={`tour-dot ${idx === currentStepIndex ? 'active' : ''} ${idx < currentStepIndex ? 'completed' : ''}`}
              onClick={() => setCurrentStepIndex(idx)}
            />
          ))}
        </div>

        {/* Botões de Ação */}
        <div className="tour-footer">
          <button
            type="button"
            className="tour-btn-skip"
            onClick={handleSkip}
          >
            Pular tutorial
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {currentStepIndex > 0 && (
              <button
                type="button"
                className="tour-btn-back"
                onClick={handlePrev}
              >
                Voltar
              </button>
            )}
            <button
              type="button"
              className="tour-btn-next"
              onClick={handleNext}
            >
              {currentStepIndex === TOUR_STEPS.length - 1 ? 'Concluir 🚀' : 'Próximo →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

