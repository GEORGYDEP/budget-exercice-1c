/**
 * Touch Drag and Drop Support for Tablets
 * Adds touch event handling to make drag and drop work on tablets
 */

export class TouchDragHandler {
  constructor() {
    this.draggedElement = null;
    this.draggedClone = null;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.currentDropZone = null;
  }

  /**
   * Enable touch drag for an element
   */
  enableTouchDrag(element) {
    element.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    element.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    element.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
  }

  handleTouchStart(e) {
    // Prevent default to avoid scrolling
    if (e.target.classList.contains('draggable-amount')) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    this.draggedElement = e.target;
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;

    // Create a visual clone of the dragged element
    this.draggedClone = this.draggedElement.cloneNode(true);
    this.draggedClone.style.position = 'fixed';
    this.draggedClone.style.left = touch.clientX + 'px';
    this.draggedClone.style.top = touch.clientY + 'px';
    this.draggedClone.style.opacity = '0.7';
    this.draggedClone.style.zIndex = '10000';
    this.draggedClone.style.pointerEvents = 'none';
    this.draggedClone.style.transform = 'scale(1.1)';
    this.draggedClone.classList.add('dragging-touch');

    document.body.appendChild(this.draggedClone);
    this.draggedElement.classList.add('dragging');
  }

  handleTouchMove(e) {
    if (!this.draggedElement || !this.draggedClone) return;

    e.preventDefault();

    const touch = e.touches[0];

    // Move the clone with the finger
    this.draggedClone.style.left = (touch.clientX - 30) + 'px';
    this.draggedClone.style.top = (touch.clientY - 15) + 'px';

    // Find the element under the touch point
    this.draggedClone.style.pointerEvents = 'none';
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    this.draggedClone.style.pointerEvents = 'auto';

    // Remove previous drop zone highlight
    if (this.currentDropZone) {
      this.currentDropZone.classList.remove('drag-over');
    }

    // Find the drop zone
    let dropZone = elementBelow;
    while (dropZone && !dropZone.classList.contains('drop-zone') && dropZone !== document.body) {
      dropZone = dropZone.parentElement;
    }

    if (dropZone && dropZone.classList.contains('drop-zone')) {
      this.currentDropZone = dropZone;
      dropZone.classList.add('drag-over');
    } else {
      this.currentDropZone = null;
    }
  }

  handleTouchEnd(e) {
    if (!this.draggedElement) return;

    e.preventDefault();

    // Remove the clone
    if (this.draggedClone) {
      this.draggedClone.remove();
      this.draggedClone = null;
    }

    this.draggedElement.classList.remove('dragging');

    // Trigger drop on the current drop zone
    if (this.currentDropZone) {
      this.currentDropZone.classList.remove('drag-over');

      // Create a synthetic drop event
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
      });

      // Copy data from the dragged element
      const amount = this.draggedElement.getAttribute('data-amount') ||
                     this.draggedElement.textContent.replace(/[^\d.,]/g, '').replace(',', '.');
      const amountIndex = this.draggedElement.getAttribute('data-amount-index') || '';
      const fromPlaced = this.draggedElement.parentElement.classList.contains('drop-zone') ? 'true' : '';
      const rubrique = this.draggedElement.parentElement.getAttribute('data-rubrique') || '';

      // Set data on the synthetic event
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          getData: (key) => {
            if (key === 'amount') return amount;
            if (key === 'amountIndex') return amountIndex;
            if (key === 'fromPlaced') return fromPlaced;
            if (key === 'rubrique') return rubrique;
            return '';
          },
          setData: () => {},
          effectAllowed: 'all',
          dropEffect: 'move'
        },
        writable: false
      });

      this.currentDropZone.dispatchEvent(dropEvent);
      this.currentDropZone = null;
    }

    this.draggedElement = null;
  }
}

/**
 * Initialize touch drag support for all draggable elements
 */
export function initTouchDrag() {
  const handler = new TouchDragHandler();

  // Enable touch drag for all existing draggable elements
  const enableForElements = () => {
    document.querySelectorAll('.draggable-amount').forEach(element => {
      if (!element.hasAttribute('data-touch-enabled')) {
        handler.enableTouchDrag(element);
        element.setAttribute('data-touch-enabled', 'true');
      }
    });
  };

  // Run initially
  enableForElements();

  // Re-run when DOM changes (for dynamically added elements)
  const observer = new MutationObserver(enableForElements);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return handler;
}
