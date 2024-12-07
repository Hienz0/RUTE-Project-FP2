import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TransportationService } from '../services/transportation.service';
import { AuthService } from '../services/auth.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import * as L from 'leaflet'; // Import Leaflet.js
import axios from 'axios'; // Import axios for reverse geocoding
import 'leaflet-search'; // Import Leaflet Search

@Component({
  selector: 'app-manage-transportation',
  templateUrl: './manage-transportation.component.html',
  styleUrls: ['./manage-transportation.component.css'],
  
})
export class ManageTransportationComponent implements OnInit, AfterViewInit {
  @ViewChild('pickupMapContainer', { static: false }) pickupMapContainer!: ElementRef;
  private mapInitialized = false;
  message: string = '';
  currentUser: any;
  transportationData: any = {}; // Adjusted to no longer use form data directly
  transportID: string | null = null;
  isEditing: boolean = false;
  productName: string = '';
  productDescription: string = '';
  productImages: string[] = []; // Array to store server paths of uploaded images
  selectedFiles: File[] = [];   // Temporary storage for files before uploading // Change to store string URLs instead of SafeUrl // Array to store URLs or paths of images
  deletedImages: string[] = []; // Array untuk menyimpan path gambar yang dihapus
  newImages: File[] = []; // Array to store newly added images
  location: string = '';
  newProductSubCategory: any[] = []; // New variable for productSubCategory
  // Add this property to hold the existing or editable productSubcategory items
  displayedProductSubCategories: any[] = [];
  deletedProductSubCategories: any[] = []; // Array untuk menyimpan subkategori yang dihapus
  pickupMarker: any; // Declare pickup marker globally
  dropoffMarker: any; // Declare dropoff marker globally

  pickupMap: any; // Declare pickup map globally
  dropoffMap: any; // Declare dropoff map globally
  defaultLat: number = -8.5069;
  defaultLng: number = 115.2625;
  defaultZoom: number = 13;
  pickupLocation: string = '';
  // Reverse geocoded addresses
  pickupAddress: string = '';
  dropoffAddress: string = '';

  

  constructor(
    private fb: FormBuilder,
    private service: TransportationService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
    
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.transportID = this.route.snapshot.paramMap.get('id');

    if (this.transportID) {
      this.service.getTransporationServicesByID(this.transportID).subscribe(
        (response) => {
          this.transportationData = response || {};
          this.productName = this.transportationData.serviceDetails.productName;
          this.productDescription = this.transportationData.serviceDetails.productDescription;
          this.productImages = this.transportationData.serviceDetails.productImages;
          console.log('foto',this.transportationData)
            // Ambil location dan pisahkan menjadi latitude dan longitude
        const location = this.transportationData.serviceDetails.location;
        const [lat, lng] = location.split(',').map((coord: string) => parseFloat(coord.trim())); // Tambahkan tipe string di sini

        this.location = location; // Simpan lokasi asli dalam format string
        console.log('Latitude:', lat, 'Longitude:', lng);

        // Panggil reverseGeocode untuk mendapatkan alamat
        this.reverseGeocode(lat, lng, 'location');

          if (this.transportationData.transportationData.productSubcategory) {
            this.displayedProductSubCategories = this.transportationData.transportationData.productSubcategory;
            console.log('Existing productSubcategory entries:', this.displayedProductSubCategories);
          }

          // Gunakan setTimeout dengan durasi yang lebih besar
          
        },
        (error) => console.error('Error fetching transportation data:', error)
      );
    }
  }

 
  ngAfterViewInit(): void {
    this.checkAndInitMap();
  }

  ngAfterViewChecked(): void {
    // Pastikan map hanya diinisialisasi sekali
    if (!this.mapInitialized) {
      this.checkAndInitMap();
    }
  }

  private checkAndInitMap(): void {
    if (this.isEditing && this.pickupMapContainer && this.pickupMapContainer.nativeElement) {
      if (!this.pickupMap) {
        this.initPickupMap(); // Inisialisasi ulang peta jika belum ada
        this.mapInitialized = true;
      }
    }
  }
  
  
 

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  
    if (this.isEditing) {
      // Jika peta sudah ada, hapus terlebih dahulu
      if (this.pickupMap) {
        this.pickupMap.remove();
        this.pickupMap = null; // Reset peta
      }
  
      this.mapInitialized = false; // Reset status inisialisasi
      setTimeout(() => this.checkAndInitMap(), 0); // Inisialisasi ulang setelah DOM berubah
    }
  }
  

  ngOnDestroy(): void {
    if (this.pickupMap) {
      this.pickupMap.remove(); // Hapus peta saat komponen dihancurkan
      this.pickupMap = null; // Reset peta
    }
  }
  

  addVehicleType(): void {
    this.newProductSubCategory.push({
      name: '',
      category: '',
      quantity: 0,
      price: 0
    });
  }
  

  removeVehicleType(index: number, existing: boolean = false): void {
    if (existing) {
      if (this.displayedProductSubCategories[index]) {
        // Tandai dengan 'delete' dan pindahkan ke deletedProductSubCategories
        const deletedSubCategory = { 
          ...this.displayedProductSubCategories[index], 
          action: 'delete' 
        };
        this.deletedProductSubCategories.push(deletedSubCategory);
        this.displayedProductSubCategories.splice(index, 1); // Hapus dari tampilan
      } else {
        console.error('Error: Invalid index for displayedProductSubCategories');
      }
    } else {
      if (this.newProductSubCategory[index]) {
        // Tandai dengan 'delete' dan pindahkan ke deletedProductSubCategories
        const deletedSubCategory = { 
          ...this.newProductSubCategory[index], 
          action: 'delete' 
        };
        this.deletedProductSubCategories.push(deletedSubCategory);
        this.newProductSubCategory.splice(index, 1); // Hapus dari tampilan
      } else {
        console.error('Error: Invalid index for newProductSubCategory');
      }
    }
  }
  
  


  


  saveTransportation(): void {
    // Preserve the existing serviceDetails if it already exists
    this.transportationData = {
      ...this.transportationData,
      serviceId: this.transportationData.serviceDetails?.id || this.transportationData.serviceDetails?._id,
      productName: this.productName,
      productDescription: this.productDescription,
      productImages: this.productImages,
      location: this.location,
    };
    
    console.log('Transportation data saved to variable:', this.transportationData);
    alert('Transportation data saved locally.');
    this.isEditing;
  }
  


  publishTransportation(): void {
    if (!this.currentUser) {
      console.error('User not available');
      return;
    }
  
    const formData = new FormData();
  
    // Tambahkan file gambar baru
    this.selectedFiles.forEach((file) => {
      formData.append('productImages', file);
    });
  
    // Gabungkan semua subkategori: aktif, baru, dan dihapus
    const allProductSubCategories = [
      ...this.displayedProductSubCategories.map((sub) => ({
        ...sub,
        action: sub.action || 'update',
      })),
      ...this.newProductSubCategory.map((sub) => ({
        ...sub,
        action: 'add',
      })),
      ...this.deletedProductSubCategories,
    ];
  
    const publishData = {
      serviceId: this.transportationData.serviceDetails?._id || this.transportationData.serviceDetails?.id,
      userId: this.currentUser.userId,
      productName: this.productName,
      productDescription: this.productDescription,
      productImages: this.productImages, // Gambar yang sudah ada
      deletedImages: this.deletedImages, // Gambar yang dihapus
      location: this.location,
      productSubCategory: allProductSubCategories,
    };
  
    formData.append('data', JSON.stringify(publishData));
  
    console.log('Publish data:', publishData);
  
    this.service.saveTransportation(formData).subscribe(
      (response) => {
        console.log('Transportation published successfully:', response);
        this.message = 'Transportation published successfully';
      },
      (error) => {
        console.error('Error publishing transportation:', error);
        this.message = 'Failed to publish transportation';
      }
    );
  }
  
  onImagesSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      this.selectedFiles = Array.from(target.files);
      console.log('Selected files:', this.selectedFiles);
    }
  }
  
  

  removeImage(index: number): void {
    const removedImage = this.productImages[index];
    // Tambahkan ke daftar gambar yang dihapus jika masih ada di daftar yang sudah ada
    if (removedImage && !this.deletedImages.includes(removedImage)) {
      this.deletedImages.push(removedImage);
    }
  
    // Hapus gambar dari daftar yang akan dikirim
    this.productImages.splice(index, 1);
    console.log('Deleted images:', this.deletedImages);
  }

  
  
  initPickupMap(): void {
    if (this.pickupMap) {
      return; // Jika sudah diinisialisasi, hentikan
    }
  
    this.pickupMap = L.map('pickupMap').setView(
      [this.defaultLat, this.defaultLng],
      this.defaultZoom
    );
  
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.pickupMap);
  
    const customIcon = L.icon({
      iconUrl: 'assets/location.png',
      iconSize: [35, 45],
      iconAnchor: [17, 45],
    });
  
    const ubudCenter = L.latLng(this.defaultLat, this.defaultLng);
    const ubudCircle = L.circle(ubudCenter, {
      color: 'blue',
      fillColor: '#add8e6',
      fillOpacity: 0.2,
      radius: 7000, // Radius 7 km
    }).addTo(this.pickupMap);
  
    this.pickupMarker = L.marker([this.defaultLat, this.defaultLng], {
      icon: customIcon,
      draggable: true,
    }).addTo(this.pickupMap);
  
    // Sesuaikan tampilan peta agar sesuai dengan bounds lingkaran
    this.pickupMap.fitBounds(ubudCircle.getBounds());
  
    // Tambahkan kontrol pencarian ke peta
    const searchControl = new (L.Control as any).Search({
      url: 'https://nominatim.openstreetmap.org/search?format=json&q={s}',
      jsonpParam: 'json_callback',
      propertyName: 'display_name',
      propertyLoc: ['lat', 'lon'],
      autoCollapse: true,
      marker: false,
      moveToLocation: (latlng: L.LatLng) => {
        const distanceFromCenter = this.pickupMap.distance(latlng, ubudCenter);
  
        // Pastikan lokasi dalam radius 7 km
        if (distanceFromCenter <= 7000) {
          this.pickupMarker.setLatLng(latlng); // Pindahkan marker ke lokasi baru
          this.pickupMap.setView(latlng, 15); // Zoom ke lokasi baru
          this.pickupLocation = `${latlng.lat}, ${latlng.lng}`;
          this.location = `${latlng.lat}, ${latlng.lng}`; // Simpan sebagai string
          this.reverseGeocode(latlng.lat, latlng.lng, 'pickup'); // Reverse geocode untuk mendapatkan alamat
        } else {
          window.alert('Anda hanya dapat memilih titik di dalam area Ubud.');
        }
      },
    }).addTo(this.pickupMap);
  
    // Drag and drop marker
    this.pickupMarker.on('dragend', (e: any) => {
      const latLng = e.target.getLatLng();
      const distanceFromCenter = this.pickupMap.distance(latLng, ubudCenter);
  
      if (distanceFromCenter <= 7000) {
        this.pickupLocation = `${latLng.lat}, ${latLng.lng}`;
        this.location = `${latLng.lat}, ${latLng.lng}`; // Simpan sebagai string
        this.reverseGeocode(latLng.lat, latLng.lng, 'pickup');
      } else {
        window.alert('Anda hanya dapat memilih titik di dalam area Ubud.');
      }
    });
  
    // Klik pada peta untuk menempatkan marker dalam bounds
    this.pickupMap.on('click', (e: any) => {
      const latLng = e.latlng;
      const distanceFromCenter = this.pickupMap.distance(latLng, ubudCenter);
  
      if (distanceFromCenter <= 7000) {
        this.pickupMarker.setLatLng(latLng);
        this.pickupLocation = `${latLng.lat}, ${latLng.lng}`;
        this.location = `${latLng.lat}, ${latLng.lng}`; // Simpan sebagai string
        this.reverseGeocode(latLng.lat, latLng.lng, 'pickup');
        this.pickupMap.setView([latLng.lat, latLng.lng], 15); // Sesuaikan level zoom jika diperlukan
      } else {
        window.alert('Anda hanya dapat memilih titik di dalam area Ubud.');
      }
    });
  }
  
  
  

  // Helper function to update the map location
  updateMapLocation(mapId: string, latitude: number, longitude: number): void {
    const map = L.map(mapId);
    const customIcon = L.icon({
      iconUrl: 'assets/location.png',
      iconSize: [35, 45],
      iconAnchor: [17, 45],
    });

    map.setView([latitude, longitude], 15); // Set map to new coordinates
    L.marker([latitude, longitude], { icon: customIcon }).addTo(map); // Add marker
  }

  // Reverse Geocoding to get the address from lat/lng
  reverseGeocode(
    lat: number,
    lng: number,
    type: 'pickup' | 'dropoff' | 'location'
  ): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    axios
      .get(url)
      .then((response) => {
        const address = response.data.display_name;

        if (type === 'pickup') {
          this.pickupAddress = address; // Set pickup address
        } else if (type === 'dropoff') {
          this.dropoffAddress = address; // Set dropoff address
        } else if (type === 'location') {
          // Update the UI for the location address
          document.getElementById('location-address')!.textContent = address;
        }
      })
      .catch((error) => {
        console.error('Error with reverse geocoding:', error);
      });
  }

  viewBookings(): void {
    if (this.transportID) {
      this.router.navigate(['/manage-bookings', this.transportID]);
    }
  }
  
getFullImagePath(image: string): string {
  return `http://localhost:3000/${image}`;
}


}

  