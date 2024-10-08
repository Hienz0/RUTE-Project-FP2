import { Component, ElementRef, ViewChild, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
import { ProviderService } from '../services/provider.service';

import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-review-services',
  templateUrl: './review-services.component.html',
  styleUrls: ['./review-services.component.css']
})
export class ReviewServicesComponent implements OnInit {
  @ViewChild('largeImageModal') largeImageModal!: ElementRef;
  @ViewChild('largeImageModalView') largeImageModalView!: ElementRef;
  listProvider: any[] = [];
  modalData: any = {}; // Properti untuk menyimpan data yang akan ditampilkan di dalam modal
  isModalVisible: boolean = false;
  largeImageUrl: string = ''; // Properti untuk menyimpan URL gambar besar
  isLargeImageVisible: boolean = false;
  isRejectModalVisible: boolean = false; // For the rejection message modal
  rejectionMessage: string = ''; // To store the rejection message
  currentProviderID: number | null = null;

  constructor(private service: ProviderService, private cdr : ChangeDetectorRef, private snackBar : MatSnackBar) {}

  ngOnInit(): void {
    this.getListProvider();
  }

  openModal(providerID: number) {
    this.service.getServicesByID(providerID).subscribe((data) => {
      this.modalData = data;
      this.isModalVisible = true;
      console.log(this.modalData);
    });
  }

  closeModal() {
    this.isModalVisible = false;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (this.isModalVisible && event.target === this.largeImageModal.nativeElement) {
      this.closeModal();
    }
  }

  showNotification(message: string, action: string, className: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      verticalPosition: 'top', // Set the position to top
      panelClass: [className]
    });
  }
  
  approveButton(id: number) {
    this.service.approveServices(id).subscribe(
      (response) => {
        console.log('Status updated successfully', response);
        this.showNotification('Services approved successfully', 'Close', 'custom-snackbar-success');
        this.closeModal(); // Menutup modal setelah berhasil approve
        this.getListProvider(); // Memperbarui daftar
        
      },
      (error) => {
        console.error('Error updating status', error);
      }
    );
  }

  openRejectModal(providerID: number) {
    this.currentProviderID = providerID;
    this.isRejectModalVisible = true;
  }

  closeRejectModal() {
    this.isRejectModalVisible = false;
    this.rejectionMessage = '';
  }

  submitRejection() {
    if (!this.rejectionMessage.trim()) {
      alert('Messages must be filled in and cannot be empty.')
      return;
    }
  
    if (this.currentProviderID !== null) {
      this.service.rejectServices(this.currentProviderID, this.rejectionMessage).subscribe(
        (response) => {
          console.log('Reject account successfully', response);
          this.closeRejectModal();
          this.getListProvider();
          this.closeModal();
          this.showNotification('Services rejected successfully', 'Close', 'custom-snackbar-error');
        },
        (error) => {
          console.error('Error rejecting account', error);
        }
      );
    }
  }
  
  

  getListProvider(): void {
    this.listProvider = []; // Reset state
    this.service.getListServices().subscribe((data) => {
      console.log('Data from backend:', data); // Log data yang diterima di frontend
      this.listProvider = data;
      this.cdr.detectChanges(); // Manually trigger change detection
    });
  }
  
  showLargeImage(imageUrl: string) {
    this.largeImageUrl = this.getFullImagePath(imageUrl);
    this.isLargeImageVisible = true;
  }

  closeLargeImageModal() {
    this.isLargeImageVisible = false;
  }

  getFullImagePath(imagePath: string): string {
    return `http://localhost:3000/${imagePath}`;
  }

}
