using RestSharp;
using System;
using System.Linq;
using System.Windows.Forms;

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

        private void btnSend_Click(object sender, EventArgs e)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(txtUrl.Text))
                {
                    MessageBox.Show("Please enter a URL.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }

                var client = new RestClient(txtUrl.Text);

                Method method;
                try
                {
                    method = (Method)Enum.Parse(typeof(Method), cmbMethod.SelectedItem.ToString());
                }
                catch
                {
                    method = Method.GET;
                }

                var request = new RestRequest(method);

                string contentType = null;

                // Add Headers
                foreach (DataGridViewRow row in gridRequestHeaders.Rows)
                {
                    // Skip new row placeholder
                    if (row.IsNewRow) continue;

                    if (row.Cells[0].Value != null && !string.IsNullOrWhiteSpace(row.Cells[0].Value.ToString()))
                    {
                        string key = row.Cells[0].Value.ToString();
                        string value = row.Cells[1].Value != null ? row.Cells[1].Value.ToString() : "";

                        request.AddHeader(key, value);

                        if (key.Equals("Content-Type", StringComparison.OrdinalIgnoreCase))
                        {
                            contentType = value;
                        }
                    }
                }

                // Add Body
                string body = txtRequestBody.Text;
                if (!string.IsNullOrWhiteSpace(body) && method != Method.GET && method != Method.HEAD)
                {
                    if (string.IsNullOrEmpty(contentType))
                    {
                        contentType = "application/json";
                        request.AddHeader("Content-Type", contentType);
                    }

                    request.AddParameter(contentType, body, ParameterType.RequestBody);
                }

                // Execute
                var response = client.Execute(request);

                // Display Status
                lblStatus.Text = $"Status: {(int)response.StatusCode} {response.StatusDescription}";

                // Display Body
                txtResponseBody.Text = response.Content;

                // Display Headers
                gridResponseHeaders.Rows.Clear();
                foreach (var header in response.Headers)
                {
                    gridResponseHeaders.Rows.Add(header.Name, header.Value);
                }

            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
