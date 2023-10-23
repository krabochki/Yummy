import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  selector: '[appPluralRu]'
})
export class PluralRuDirective implements OnChanges {

    //директива для подстановки к числам правильных форм слов 


    @Input() arVariants: string[] = [];
    @Input() value: number =0;

    constructor(
        private el: ElementRef
    ) {
    }

    ngOnChanges(): void {
        if (this.el) {
            this.el.nativeElement.innerHTML =
                this.value % 10 === 1 && this.value % 100 !== 11
                    ? this.arVariants[0]
                    : this.value % 10 >= 2 &&
                    this.value % 10 <= 4 &&
                    (this.value % 100 < 10 || this.value % 100 >= 20)
                        ? this.arVariants[1]
                        : this.arVariants[2];
        }
    }
}


