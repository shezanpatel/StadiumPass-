import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  templateUrl: './skeleton-loader.component.html'
})
export class SkeletonLoaderComponent {
  @Input() type: 'card' | 'list' | 'text' | 'circle' = 'card';
  @Input() count = 1;
  get items(): number[] { return Array.from({ length: this.count }, (_, i) => i); }
}
