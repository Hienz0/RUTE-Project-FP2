import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-customize-profile',
  templateUrl: './customize-profile.component.html',
  styleUrls: ['./customize-profile.component.css']
})
export class CustomizeProfileComponent implements OnInit {
  currentUser: any;

  constructor(private authService: AuthService){}
  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue; 
    console.log(this.currentUser);
  }
}
