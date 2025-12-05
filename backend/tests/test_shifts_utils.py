"""
Unit tests for shifts router utility functions.
Tests UPT accrual calculation logic.

UPT (Unpaid Time) Accrual Policy:
Amazon's policy grants 5 minutes of UPT per hour worked.
Formula: (hours_worked * 5 minutes) / 60 = UPT hours earned
Example: 10-hour shift earns 50 minutes = 0.833 hours of UPT
"""
import pytest
from app.routers.shifts import calculate_upt_accrual


@pytest.mark.unit
class TestCalculateUPTAccrual:
    """Tests for the UPT accrual calculation function."""
    
    def test_calculate_upt_accrual_standard_10_hour_shift(self) -> None:
        """Test UPT accrual for a standard 10-hour shift."""
        hours_worked = 10.0
        # 10 hours * 5 minutes per hour = 50 minutes = 0.8333... hours
        expected_upt = 50 / 60.0
        
        result = calculate_upt_accrual(hours_worked)
        
        assert abs(result - expected_upt) < 0.001
    
    def test_calculate_upt_accrual_8_hour_shift(self) -> None:
        """Test UPT accrual for an 8-hour shift."""
        hours_worked = 8.0
        # 8 hours * 5 minutes per hour = 40 minutes = 0.6666... hours
        expected_upt = 40 / 60.0
        
        result = calculate_upt_accrual(hours_worked)
        
        assert abs(result - expected_upt) < 0.001
    
    def test_calculate_upt_accrual_zero_hours(self) -> None:
        """Test UPT accrual for zero hours worked."""
        hours_worked = 0.0
        expected_upt = 0.0
        
        result = calculate_upt_accrual(hours_worked)
        
        assert result == expected_upt
    
    def test_calculate_upt_accrual_partial_hour(self) -> None:
        """Test UPT accrual for partial hour."""
        hours_worked = 1.5
        # 1.5 hours * 5 minutes per hour = 7.5 minutes = 0.125 hours
        expected_upt = 7.5 / 60.0
        
        result = calculate_upt_accrual(hours_worked)
        
        assert abs(result - expected_upt) < 0.001
    
    def test_calculate_upt_accrual_very_long_shift(self) -> None:
        """Test UPT accrual for a very long shift."""
        hours_worked = 12.0
        # 12 hours * 5 minutes per hour = 60 minutes = 1.0 hour
        expected_upt = 60 / 60.0
        
        result = calculate_upt_accrual(hours_worked)
        
        assert abs(result - expected_upt) < 0.001
    
    def test_calculate_upt_accrual_formula_accuracy(self) -> None:
        """Test that the calculation follows the correct formula."""
        # Formula: (hours_worked * 5) / 60
        test_cases = [
            (1.0, 5 / 60.0),
            (2.0, 10 / 60.0),
            (5.0, 25 / 60.0),
            (10.0, 50 / 60.0),
            (12.0, 60 / 60.0),
        ]
        
        for hours, expected in test_cases:
            result = calculate_upt_accrual(hours)
            assert abs(result - expected) < 0.001, f"Failed for {hours} hours"
