namespace PingHermano
{
    partial class Form1
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            this.cmbMethod = new System.Windows.Forms.ComboBox();
            this.txtUrl = new System.Windows.Forms.TextBox();
            this.btnSend = new System.Windows.Forms.Button();
            this.tabRequest = new System.Windows.Forms.TabControl();
            this.tabRequestBody = new System.Windows.Forms.TabPage();
            this.txtRequestBody = new System.Windows.Forms.RichTextBox();
            this.tabRequestHeaders = new System.Windows.Forms.TabPage();
            this.gridRequestHeaders = new System.Windows.Forms.DataGridView();
            this.colReqKey = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.colReqValue = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.tabResponse = new System.Windows.Forms.TabControl();
            this.tabResponseBody = new System.Windows.Forms.TabPage();
            this.txtResponseBody = new System.Windows.Forms.RichTextBox();
            this.tabResponseHeaders = new System.Windows.Forms.TabPage();
            this.gridResponseHeaders = new System.Windows.Forms.DataGridView();
            this.colRespKey = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.colRespValue = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.lblStatus = new System.Windows.Forms.Label();
            this.tabRequest.SuspendLayout();
            this.tabRequestBody.SuspendLayout();
            this.tabRequestHeaders.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.gridRequestHeaders)).BeginInit();
            this.tabResponse.SuspendLayout();
            this.tabResponseBody.SuspendLayout();
            this.tabResponseHeaders.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.gridResponseHeaders)).BeginInit();
            this.SuspendLayout();
            // 
            // cmbMethod
            // 
            this.cmbMethod.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cmbMethod.FormattingEnabled = true;
            this.cmbMethod.Location = new System.Drawing.Point(12, 12);
            this.cmbMethod.Name = "cmbMethod";
            this.cmbMethod.Size = new System.Drawing.Size(121, 21);
            this.cmbMethod.TabIndex = 0;
            // 
            // txtUrl
            // 
            this.txtUrl.Location = new System.Drawing.Point(139, 13);
            this.txtUrl.Name = "txtUrl";
            this.txtUrl.Size = new System.Drawing.Size(568, 20);
            this.txtUrl.TabIndex = 1;
            // 
            // btnSend
            // 
            this.btnSend.Location = new System.Drawing.Point(713, 11);
            this.btnSend.Name = "btnSend";
            this.btnSend.Size = new System.Drawing.Size(75, 23);
            this.btnSend.TabIndex = 2;
            this.btnSend.Text = "Send";
            this.btnSend.UseVisualStyleBackColor = true;
            this.btnSend.Click += new System.EventHandler(this.btnSend_Click);
            // 
            // tabRequest
            // 
            this.tabRequest.Controls.Add(this.tabRequestBody);
            this.tabRequest.Controls.Add(this.tabRequestHeaders);
            this.tabRequest.Location = new System.Drawing.Point(12, 50);
            this.tabRequest.Name = "tabRequest";
            this.tabRequest.SelectedIndex = 0;
            this.tabRequest.Size = new System.Drawing.Size(380, 500);
            this.tabRequest.TabIndex = 3;
            // 
            // tabRequestBody
            // 
            this.tabRequestBody.Controls.Add(this.txtRequestBody);
            this.tabRequestBody.Location = new System.Drawing.Point(4, 22);
            this.tabRequestBody.Name = "tabRequestBody";
            this.tabRequestBody.Padding = new System.Windows.Forms.Padding(3);
            this.tabRequestBody.Size = new System.Drawing.Size(372, 474);
            this.tabRequestBody.TabIndex = 0;
            this.tabRequestBody.Text = "Body";
            this.tabRequestBody.UseVisualStyleBackColor = true;
            // 
            // txtRequestBody
            // 
            this.txtRequestBody.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtRequestBody.Location = new System.Drawing.Point(3, 3);
            this.txtRequestBody.Name = "txtRequestBody";
            this.txtRequestBody.Size = new System.Drawing.Size(366, 468);
            this.txtRequestBody.TabIndex = 0;
            this.txtRequestBody.Text = "";
            //
            // tabRequestHeaders
            //
            this.tabRequestHeaders.Controls.Add(this.gridRequestHeaders);
            this.tabRequestHeaders.Location = new System.Drawing.Point(4, 22);
            this.tabRequestHeaders.Name = "tabRequestHeaders";
            this.tabRequestHeaders.Padding = new System.Windows.Forms.Padding(3);
            this.tabRequestHeaders.Size = new System.Drawing.Size(372, 474);
            this.tabRequestHeaders.TabIndex = 1;
            this.tabRequestHeaders.Text = "Headers";
            this.tabRequestHeaders.UseVisualStyleBackColor = true;
            //
            // gridRequestHeaders
            //
            this.gridRequestHeaders.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.gridRequestHeaders.Columns.AddRange(new System.Windows.Forms.DataGridViewColumn[] {
            this.colReqKey,
            this.colReqValue});
            this.gridRequestHeaders.Dock = System.Windows.Forms.DockStyle.Fill;
            this.gridRequestHeaders.Location = new System.Drawing.Point(3, 3);
            this.gridRequestHeaders.Name = "gridRequestHeaders";
            this.gridRequestHeaders.Size = new System.Drawing.Size(366, 468);
            this.gridRequestHeaders.TabIndex = 0;
            //
            // colReqKey
            //
            this.colReqKey.HeaderText = "Key";
            this.colReqKey.Name = "colReqKey";
            this.colReqKey.Width = 150;
            //
            // colReqValue
            //
            this.colReqValue.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
            this.colReqValue.HeaderText = "Value";
            this.colReqValue.Name = "colReqValue";
            //
            // tabResponse
            //
            this.tabResponse.Controls.Add(this.tabResponseBody);
            this.tabResponse.Controls.Add(this.tabResponseHeaders);
            this.tabResponse.Location = new System.Drawing.Point(408, 50);
            this.tabResponse.Name = "tabResponse";
            this.tabResponse.SelectedIndex = 0;
            this.tabResponse.Size = new System.Drawing.Size(380, 500);
            this.tabResponse.TabIndex = 4;
            //
            // tabResponseBody
            //
            this.tabResponseBody.Controls.Add(this.txtResponseBody);
            this.tabResponseBody.Location = new System.Drawing.Point(4, 22);
            this.tabResponseBody.Name = "tabResponseBody";
            this.tabResponseBody.Padding = new System.Windows.Forms.Padding(3);
            this.tabResponseBody.Size = new System.Drawing.Size(372, 474);
            this.tabResponseBody.TabIndex = 0;
            this.tabResponseBody.Text = "Body";
            this.tabResponseBody.UseVisualStyleBackColor = true;
            //
            // txtResponseBody
            //
            this.txtResponseBody.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtResponseBody.Location = new System.Drawing.Point(3, 3);
            this.txtResponseBody.Name = "txtResponseBody";
            this.txtResponseBody.ReadOnly = true;
            this.txtResponseBody.Size = new System.Drawing.Size(366, 468);
            this.txtResponseBody.TabIndex = 0;
            this.txtResponseBody.Text = "";
            //
            // tabResponseHeaders
            //
            this.tabResponseHeaders.Controls.Add(this.gridResponseHeaders);
            this.tabResponseHeaders.Location = new System.Drawing.Point(4, 22);
            this.tabResponseHeaders.Name = "tabResponseHeaders";
            this.tabResponseHeaders.Padding = new System.Windows.Forms.Padding(3);
            this.tabResponseHeaders.Size = new System.Drawing.Size(372, 474);
            this.tabResponseHeaders.TabIndex = 1;
            this.tabResponseHeaders.Text = "Headers";
            this.tabResponseHeaders.UseVisualStyleBackColor = true;
            //
            // gridResponseHeaders
            //
            this.gridResponseHeaders.AllowUserToAddRows = false;
            this.gridResponseHeaders.AllowUserToDeleteRows = false;
            this.gridResponseHeaders.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.gridResponseHeaders.Columns.AddRange(new System.Windows.Forms.DataGridViewColumn[] {
            this.colRespKey,
            this.colRespValue});
            this.gridResponseHeaders.Dock = System.Windows.Forms.DockStyle.Fill;
            this.gridResponseHeaders.Location = new System.Drawing.Point(3, 3);
            this.gridResponseHeaders.Name = "gridResponseHeaders";
            this.gridResponseHeaders.ReadOnly = true;
            this.gridResponseHeaders.Size = new System.Drawing.Size(366, 468);
            this.gridResponseHeaders.TabIndex = 0;
            //
            // colRespKey
            //
            this.colRespKey.HeaderText = "Key";
            this.colRespKey.Name = "colRespKey";
            this.colRespKey.ReadOnly = true;
            this.colRespKey.Width = 150;
            //
            // colRespValue
            //
            this.colRespValue.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
            this.colRespValue.HeaderText = "Value";
            this.colRespValue.Name = "colRespValue";
            this.colRespValue.ReadOnly = true;
            //
            // lblStatus
            //
            this.lblStatus.AutoSize = true;
            this.lblStatus.Location = new System.Drawing.Point(409, 560);
            this.lblStatus.Name = "lblStatus";
            this.lblStatus.Size = new System.Drawing.Size(37, 13);
            this.lblStatus.TabIndex = 5;
            this.lblStatus.Text = "Status: ";
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(800, 600);
            this.Controls.Add(this.lblStatus);
            this.Controls.Add(this.tabResponse);
            this.Controls.Add(this.tabRequest);
            this.Controls.Add(this.btnSend);
            this.Controls.Add(this.txtUrl);
            this.Controls.Add(this.cmbMethod);
            this.Name = "Form1";
            this.Text = "Simple Postman";
            this.tabRequest.ResumeLayout(false);
            this.tabRequestBody.ResumeLayout(false);
            this.tabRequestHeaders.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)(this.gridRequestHeaders)).EndInit();
            this.tabResponse.ResumeLayout(false);
            this.tabResponseBody.ResumeLayout(false);
            this.tabResponseHeaders.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)(this.gridResponseHeaders)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.ComboBox cmbMethod;
        private System.Windows.Forms.TextBox txtUrl;
        private System.Windows.Forms.Button btnSend;
        private System.Windows.Forms.TabControl tabRequest;
        private System.Windows.Forms.TabPage tabRequestBody;
        private System.Windows.Forms.RichTextBox txtRequestBody;
        private System.Windows.Forms.TabPage tabRequestHeaders;
        private System.Windows.Forms.DataGridView gridRequestHeaders;
        private System.Windows.Forms.DataGridViewTextBoxColumn colReqKey;
        private System.Windows.Forms.DataGridViewTextBoxColumn colReqValue;
        private System.Windows.Forms.TabControl tabResponse;
        private System.Windows.Forms.TabPage tabResponseBody;
        private System.Windows.Forms.RichTextBox txtResponseBody;
        private System.Windows.Forms.TabPage tabResponseHeaders;
        private System.Windows.Forms.DataGridView gridResponseHeaders;
        private System.Windows.Forms.DataGridViewTextBoxColumn colRespKey;
        private System.Windows.Forms.DataGridViewTextBoxColumn colRespValue;
        private System.Windows.Forms.Label lblStatus;
    }
}
