using RestSharp;
using System;
using System.Linq;
using System.Windows.Forms;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace PingHermano
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
            InitializeCustomComponents();
        }

        private void InitializeCustomComponents()
        {
            // Populate HTTP Methods
            // Note: Depending on RestSharp version, Method enum might have different values.
            // We use basic ones.
            cmbMethod.Items.AddRange(new string[] { "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS" });
            cmbMethod.SelectedItem = "GET";
        }

        private async void btnSend_Click(object sender, EventArgs e)
        {
            try
            {
                // 1. Validate Input
                if (string.IsNullOrWhiteSpace(txtUrl.Text))
                {
                    MessageBox.Show("Please enter a URL.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }

                string url = txtUrl.Text;
                string methodString = cmbMethod.SelectedItem.ToString();
                string body = txtRequestBody.Text;

                // 2. Prepare Request Data (UI Thread)
                Method method;
                try
                {
                    method = (Method)Enum.Parse(typeof(Method), methodString);
                }
                catch
                {
                    method = Method.GET;
                }

                var headers = new List<KeyValuePair<string, string>>();
                string contentType = null;

                foreach (DataGridViewRow row in gridRequestHeaders.Rows)
                {
                    if (row.IsNewRow) continue;

                    if (row.Cells[0].Value != null && !string.IsNullOrWhiteSpace(row.Cells[0].Value.ToString()))
                    {
                        string key = row.Cells[0].Value.ToString();
                        string value = row.Cells[1].Value != null ? row.Cells[1].Value.ToString() : "";
                        headers.Add(new KeyValuePair<string, string>(key, value));

                        if (key.Equals("Content-Type", StringComparison.OrdinalIgnoreCase))
                        {
                            contentType = value;
                        }
                    }
                }

                // 3. Update UI State
                btnSend.Enabled = false;
                btnSend.Text = "Sending...";
                Cursor = Cursors.WaitCursor;
                lblStatus.Text = "Status: Sending...";
                txtResponseBody.Text = "";
                gridResponseHeaders.Rows.Clear();

                // 4. Execute Request (Background Thread)
                IRestResponse response = await Task.Run(() =>
                {
                    var client = new RestClient(url);
                    var request = new RestRequest(method);

                    foreach (var header in headers)
                    {
                        request.AddHeader(header.Key, header.Value);
                    }

                    if (!string.IsNullOrWhiteSpace(body) && method != Method.GET && method != Method.HEAD)
                    {
                        if (string.IsNullOrEmpty(contentType))
                        {
                            contentType = "application/json";
                            request.AddHeader("Content-Type", contentType);
                        }
                        request.AddParameter(contentType, body, ParameterType.RequestBody);
                    }

                    return client.Execute(request);
                });

                // 5. Update UI with Response (UI Thread)
                lblStatus.Text = $"Status: {(int)response.StatusCode} {response.StatusDescription}";

                // Format JSON if possible
                string responseContent = response.Content;
                if (!string.IsNullOrWhiteSpace(responseContent))
                {
                    try
                    {
                        // Check if content type indicates JSON
                        bool isJson = false;
                        var respContentType = response.Headers.FirstOrDefault(h => h.Name.Equals("Content-Type", StringComparison.OrdinalIgnoreCase));
                        if (respContentType != null && respContentType.Value.ToString().Contains("json"))
                        {
                            isJson = true;
                        }
                        // Or try to parse anyway if it looks like JSON
                        else if (responseContent.TrimStart().StartsWith("{") || responseContent.TrimStart().StartsWith("["))
                        {
                            isJson = true;
                        }

                        if (isJson)
                        {
                            responseContent = JToken.Parse(responseContent).ToString(Formatting.Indented);
                        }
                    }
                    catch
                    {
                        // Ignore parsing errors, just show raw content
                    }
                }

                txtResponseBody.Text = responseContent;

                foreach (var header in response.Headers)
                {
                    gridResponseHeaders.Rows.Add(header.Name, header.Value);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                lblStatus.Text = "Status: Error";
            }
            finally
            {
                // 6. Restore UI State
                btnSend.Enabled = true;
                btnSend.Text = "Send";
                Cursor = Cursors.Default;
            }
        }
    }
}
