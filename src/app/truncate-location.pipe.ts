import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncateLocation'
})
export class TruncateLocationPipe implements PipeTransform {
  transform(value: string | undefined, limit: number = 2): string {
    if (!value) return '';
    
    // Split the string by commas and join back the required parts
    const parts = value.split(',');
    return parts.slice(0, limit).join(', ');
  }
}
