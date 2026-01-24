from playwright.sync_api import sync_playwright
import time

def verify(page):
    page.goto("http://localhost:5173")

    # 1. Check Collections Tab
    page.click("text=Collections")
    time.sleep(0.5)
    # Check for Import/Export buttons (using title attribute)
    page.wait_for_selector('[title="Import Collections"]')
    page.wait_for_selector('[title="Export Collections"]')

    # 2. Check Envs Tab
    page.click("text=Envs")
    time.sleep(0.5)
    page.wait_for_selector('[title="Import Environments"]')
    page.wait_for_selector('[title="Export Environments"]')

    # 3. Check Code Modal
    # Go back to Request (implicit in History or just check editor)
    # The code button is in RequestEditor which is always visible
    page.click('[title="Generate Code"]')
    time.sleep(0.5)
    page.wait_for_selector('text=Generate Code') # Modal Header
    page.wait_for_selector('text=cURL')

    page.screenshot(path="verification_screenshots/new_features.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    try:
        verify(page)
    except Exception as e:
        print(e)
        page.screenshot(path="verification_screenshots/error.png")
    finally:
        browser.close()
