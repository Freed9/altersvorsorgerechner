import { Directive, ElementRef, HostListener, OnDestroy } from '@angular/core';

@Directive({ selector: '.info-tip', standalone: true })
export class InfoTipDirective implements OnDestroy {
  private static active: InfoTipDirective | null = null;
  private outsideHandler: (() => void) | null = null;

  constructor(private el: ElementRef<HTMLElement>) {}

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    event.stopPropagation();
    const host = this.el.nativeElement;
    const wasOpen = host.classList.contains('info-tip--open');

    InfoTipDirective.active?.doClose();
    if (!wasOpen) this.doOpen();
  }

  private doOpen() {
    const host = this.el.nativeElement;
    host.classList.add('info-tip--open');
    InfoTipDirective.active = this;
    this.fixViewportPosition();
    this.outsideHandler = () => this.doClose();
    document.addEventListener('click', this.outsideHandler);
  }

  doClose() {
    const host = this.el.nativeElement;
    host.classList.remove('info-tip--open');
    const content = host.querySelector<HTMLElement>('.info-tip__content');
    if (content) {
      content.style.left = '';
      content.style.right = '';
      content.style.transform = '';
    }
    if (InfoTipDirective.active === this) InfoTipDirective.active = null;
    if (this.outsideHandler) {
      document.removeEventListener('click', this.outsideHandler);
      this.outsideHandler = null;
    }
  }

  private fixViewportPosition() {
    const content = this.el.nativeElement.querySelector<HTMLElement>('.info-tip__content');
    if (!content) return;

    content.style.left = '';
    content.style.right = '';
    content.style.transform = '';

    requestAnimationFrame(() => {
      const rect = content.getBoundingClientRect();
      if (rect.width === 0) return; // content not visible

      const vw = window.innerWidth;
      const edge = 8;

      if (rect.right > vw - edge || rect.left < edge) {
        const parentRect = this.el.nativeElement.getBoundingClientRect();
        const ideal = parentRect.left + parentRect.width / 2 - rect.width / 2;
        const clamped = Math.max(edge, Math.min(ideal, vw - rect.width - edge));
        content.style.left = `${clamped - parentRect.left}px`;
        content.style.right = 'auto';
        content.style.transform = 'none';
      }
    });
  }

  ngOnDestroy() {
    this.doClose();
  }
}
