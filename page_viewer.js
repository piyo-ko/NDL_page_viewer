'use strict';

// 擬似的に名前空間を作るために、
// クラスを作り、その静的プロパティと静的メソッドを使っている。
class PageViewer {
  static pid = '';
  static ref_koma_No = 0;
  static ref_lhs_page_No = 0;
  static top_margin = 12;
  static bottom_margin = 12;
  static left_margin = 12;
  static right_margin = 12;
  static cur_page = 0;
  static configured = false;
  static get url() {
    if (!PageViewer.configured || PageViewer.cur_page == 0) {
      return(undefined); 
    }

    /*
    cf. https://dl.ndl.go.jp/static/files/IIIF_interface_Jp.pdf#page=3
    一般形式
    {scheme}://{server}/{prefix}/{identifier}/{region}/{size}/{rotation}/{quality}.{format}
    ここで使う形式として、以下のものを想定する。
    https://www.dl.ndl.go.jp/api/iiif/{pid}/{Rnnnnnnn}/pct:{x},{y},{w},{h}/full/0/default.jpg
    なお、Rnnnnnnnは、'R'の後に0埋め7桁のコマ番号を続けたものとする。
    pctはパーセンテージ指定を表す。
    */

    const odd_page_is_on_lhs = PageViewer.ref_lhs_page_No % 2 == 1,
          cur_page_is_odd = PageViewer.cur_page % 2 == 1,
          y_top = PageViewer.top_margin,
          h = 100 - PageViewer.top_margin - PageViewer.bottom_margin;
    let cur_koma_No, x_left, w;

    if (odd_page_is_on_lhs) { // 📖 [ 奇数 | 偶数 ]
      if (cur_page_is_odd) { // 📖 [ cur_page | cur_page - 1 ]
        cur_koma_No = PageViewer.ref_koma_No + 
          (PageViewer.cur_page - PageViewer.ref_lhs_page_No) / 2;
        x_left = PageViewer.left_margin;
        w = 50 - x_left;
      } else { // 📖 [ cur_page + 1 | cur_page ]
        cur_koma_No = PageViewer.ref_koma_No + 
          (PageViewer.cur_page + 1 - PageViewer.ref_lhs_page_No) / 2;
        x_left = 50;
        w = 50 - PageViewer.right_margin;
      }
    } else { // 📖 [ 偶数 | 奇数 ]
      if (cur_page_is_odd) { // 📖 [ cur_page + 1 | cur_page ]
        cur_koma_No = PageViewer.ref_koma_No + 
          (PageViewer.cur_page + 1 - PageViewer.ref_lhs_page_No) / 2;
        x_left = 50;
        w = 50 - PageViewer.right_margin;
      } else { // 📖 [ cur_page | cur_page - 1 ]
        cur_koma_No = PageViewer.ref_koma_No + 
          (PageViewer.cur_page - PageViewer.ref_lhs_page_No) / 2;
        x_left = PageViewer.left_margin;
        w = 50 - x_left;
      }
    }

    return(`https://www.dl.ndl.go.jp/api/iiif/${ PageViewer.pid }/R${ cur_koma_No.toString().padStart(7, '0') }/pct:${ x_left },${ y_top },${ w },${ h }/full/0/default.jpg`);
  }
}

function config() {
  const pid = document.in.pid.value;
  if (! /^\d+$/.test(pid)) { 
    alert('pidは数字の並びのはず');
    return;
  }

  const ref_koma_No = parseInt(document.in.ref_koma_No.value);
  if (! Number.isInteger(ref_koma_No) || ref_koma_No < 1) {
    alert('コマ番号がおかしい');
    return;
  }

  const ref_lhs_page_No = parseInt(document.in.ref_lhs_page_No.value);
  if (! Number.isInteger(ref_lhs_page_No) || ref_lhs_page_No < 1) {
    alert('左側ページの指定がおかしい');
    return;
  }

  const Max_margin = 40;
  const top_margin = parseFloat(document.in.top_margin.value);
  if (Number.isNaN(top_margin) || top_margin < 0 || Max_margin <= top_margin) {
    alert('上余白の指定がおかしい');
    return;
  }

  const bottom_margin = parseFloat(document.in.bottom_margin.value);
  if (Number.isNaN(bottom_margin) || bottom_margin < 0 || Max_margin <= bottom_margin) {
    alert('下余白の指定がおかしい');
    return;
  }

  const left_margin = parseFloat(document.in.left_margin.value);
  if (Number.isNaN(left_margin) || left_margin < 0 || Max_margin <= left_margin) {
    alert('左余白の指定がおかしい');
    return;
  }

  const right_margin = parseFloat(document.in.right_margin.value);
  if (Number.isNaN(right_margin) || right_margin < 0 || Max_margin <= right_margin) {
    alert('右余白の指定がおかしい');
    return;
  }

  PageViewer.pid = pid;
  PageViewer.ref_koma_No = ref_koma_No;
  PageViewer.ref_lhs_page_No = ref_lhs_page_No;
  PageViewer.top_margin = top_margin;
  PageViewer.bottom_margin = bottom_margin;
  PageViewer.left_margin = left_margin;
  PageViewer.right_margin = right_margin;
  PageViewer.configured = true;

  document.getElementById('status').textContent = '✅ 設定済み';
  document.in.btn_jump.disabled = false;

  return;
}

function config_modified() {
  PageViewer.configured = false;
  document.getElementById('status').textContent = '⚠️ 書き換え中。設定ボタンで決定して下さい。';
  document.in.btn_jump.disabled = true;
  document.in.btn_prev_page.disabled = true;
  document.in.btn_next_page.disabled = true;
}

function jump() {
  if (!PageViewer.configured) {
    alert('設定を先にして下さい');
    return;
  }
  const target_page = parseInt(document.in.target_page.value);
  if (!Number.isInteger(target_page) || target_page < 1) {
    alert('閲覧したいページの指定がおかしい');
    PageViewer.cur_page = 0;
    return;
  }
  PageViewer.cur_page = target_page;
  document.getElementById('page_img').src = PageViewer.url;
  if (1 < target_page) {
    document.in.btn_prev_page.disabled = false;
  } else {
    document.in.btn_prev_page.disabled = true;
  }
  document.in.btn_next_page.disabled = false;
}

function prev_page() {
  PageViewer.cur_page--;
  document.getElementById('page_img').src = PageViewer.url;
  document.in.target_page.value = PageViewer.cur_page;
  if (PageViewer.cur_page == 1) {
    document.in.btn_prev_page.disabled = true;
  }
}

function next_page() {
  PageViewer.cur_page++;
  document.getElementById('page_img').src = PageViewer.url;
  document.in.target_page.value = PageViewer.cur_page;
  document.in.btn_prev_page.disabled = false;
}

function img_fitting() {
  document.getElementById('page_img').height = document.getElementById('viewer').offsetHeight;

}

window.addEventListener('load', () => {
  img_fitting();
});

window.addEventListener('resize', () => {
  img_fitting();
});
