import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrackerPage } from './cracker.page';

describe('CrackerPage', () => {
  let component: CrackerPage;
  let fixture: ComponentFixture<CrackerPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(CrackerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
