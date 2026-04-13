"""
Xử lý file CSV chấm công
"""

import csv
import pandas as pd
from datetime import datetime, date
from pathlib import Path

class AttendanceCSV:
    """Quản lý file CSV chấm công"""
    
    def __init__(self, file_path):
        self.file_path = Path(file_path)
        self.columns = [
            'ID', 'Name', 'Date', 'Check_in', 'Check_out',
            'Status', 'Late_minutes', 'Early_minutes'
        ]
        
        # Tạo file nếu chưa tồn tại
        if not self.file_path.exists():
            self._create_empty_csv()
    
    def _create_empty_csv(self):
        """Tạo file CSV trống"""
        with open(self.file_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(self.columns)
    
    def add_record(self, record):
        """Thêm bản ghi mới"""
        # Đọc toàn bộ dữ liệu
        df = self._read_csv()
        
        # Tìm bản ghi cũ cùng ngày
        today = record['Date']
        existing = df[(df['ID'] == record['ID']) & (df['Date'] == today)]
        
        if len(existing) > 0:
            # Cập nhật check_out
            idx = existing.index[0]
            df.at[idx, 'Check_out'] = record['Check_out']
            df.at[idx, 'Early_minutes'] = record['Early_minutes']
        else:
            # Thêm mới
            new_row = pd.DataFrame([record])
            df = pd.concat([df, new_row], ignore_index=True)
        
        # Lưu lại
        self._save_csv(df)
    
    def update_check_out(self, user_id, user_name, check_out_time):
        """Cập nhật giờ ra"""
        df = self._read_csv()
        today = check_out_time.strftime('%Y-%m-%d')
        
        # Tìm bản ghi hôm nay chưa check_out
        mask = (df['ID'] == user_id) & (df['Date'] == today) & (df['Check_out'] == '')
        
        if df[mask].empty:
            # Tạo bản ghi mới nếu chưa có check_in
            record = {
                'ID': user_id,
                'Name': user_name,
                'Date': today,
                'Check_in': '',
                'Check_out': check_out_time.strftime('%H:%M:%S'),
                'Status': 'On Time',
                'Late_minutes': 0,
                'Early_minutes': 0
            }
            self.add_record(record)
        else:
            # Cập nhật check_out
            idx = df[mask].index[0]
            df.at[idx, 'Check_out'] = check_out_time.strftime('%H:%M:%S')
            
            # Tính về sớm
            if df.at[idx, 'Check_in'] != '':
                from datetime import datetime
                check_in = datetime.strptime(df.at[idx, 'Check_in'], '%H:%M:%S')
                check_out = datetime.strptime(df.at[idx, 'Check_out'], '%H:%M:%S')
                
                # Tính số phút về sớm (so với 17:00)
                standard_out = datetime.strptime('17:00:00', '%H:%M:%S')
                early_minutes = max(0, (standard_out - check_out).seconds // 60)
                df.at[idx, 'Early_minutes'] = early_minutes
            
            self._save_csv(df)
    
    def get_all_records(self):
        """Lấy tất cả bản ghi"""
        df = self._read_csv()
        return df.to_dict('records')
    
    def get_today_records(self):
        """Lấy bản ghi hôm nay"""
        df = self._read_csv()
        today = date.today().strftime('%Y-%m-%d')
        
        today_df = df[df['Date'] == today]
        return today_df.to_dict('records')
    
    def to_csv(self):
        """Xuất toàn bộ dữ liệu thành CSV string"""
        df = self._read_csv()
        return df.to_csv(index=False)
    
    def _read_csv(self):
        """Đọc file CSV"""
        if not self.file_path.exists():
            return pd.DataFrame(columns=self.columns)
        
        df = pd.read_csv(self.file_path)
        return df
    
    def _save_csv(self, df):
        """Lưu DataFrame ra CSV"""
        df.to_csv(self.file_path, index=False)